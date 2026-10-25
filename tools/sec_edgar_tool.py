#!/usr/bin/env python3
"""
SEC EDGAR Tool for autonomous agents.
Optimized for AI token efficiency, execution speed, and low resource overhead.
Usage:
    python sec_edgar_tool.py filings --ticker AAPL --form 10-K --limit 3
    python sec_edgar_tool.py concept --ticker AAPL --concept Revenues
    python sec_edgar_tool.py --compact filings --ticker AAPL --limit 2
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict
import requests

DEFAULT_USER_AGENT = os.environ.get(
    "SEC_EDGAR_USER_AGENT",
    "AntigravityAgent/1.0 (developer-contact@internal.local)"
)
CACHE_DIR = Path(os.environ.get("SEC_CACHE_DIR", Path.home() / ".cache" / "sec_edgar"))
CACHE_FILE = CACHE_DIR / "company_tickers.json"
CACHE_TTL_SECONDS = 86400  # 24 hours

_SESSION = requests.Session()
_SESSION.headers.update({"User-Agent": DEFAULT_USER_AGENT})


def _get_ticker_map() -> Dict[str, str]:
    """Retrieves ticker -> CIK map with disk caching to avoid downloading 3.5MB repeatedly."""
    now = time.time()
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    if CACHE_FILE.exists() and (now - CACHE_FILE.stat().st_mtime < CACHE_TTL_SECONDS):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass  # Fallback to refetching if corrupt

    url = "https://www.sec.gov/files/company_tickers.json"
    res = _SESSION.get(url, timeout=10)
    res.raise_for_status()
    raw_data = res.json()

    # Pre-index by ticker for O(1) lookups
    ticker_map = {
        item["ticker"].upper().strip(): str(item["cik_str"]).zfill(10)
        for item in raw_data.values()
        if "ticker" in item and "cik_str" in item
    }

    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(ticker_map, f)
    except OSError:
        pass  # Proceed even if filesystem is read-only

    return ticker_map


def _resolve_cik(ticker: str) -> str:
    """O(1) resolution of ticker to 10-digit zero-padded CIK string."""
    ticker_map = _get_ticker_map()
    target = ticker.upper().strip()
    cik = ticker_map.get(target)
    if not cik:
        raise ValueError(f"Ticker '{ticker}' not found in SEC company records.")
    return cik


def get_filings(ticker: str, form_type: str = "10-K", limit: int = 5) -> Dict[str, Any]:
    """Retrieves metadata and direct links for recent SEC filings."""
    cik = _resolve_cik(ticker)
    url = f"https://data.sec.gov/submissions/CIK{cik}.json"

    res = _SESSION.get(url, timeout=10)
    res.raise_for_status()
    data = res.json()

    recent = data.get("filings", {}).get("recent", {})
    forms = recent.get("form", [])
    filing_dates = recent.get("filingDate", [])
    report_dates = recent.get("reportDate", [])
    accession_numbers = recent.get("accessionNumber", [])
    primary_docs = recent.get("primaryDocument", [])

    results = []
    target_form = form_type.upper()
    cik_int = int(cik)

    for i, form in enumerate(forms):
        if target_form == "ALL" or form.upper() == target_form:
            acc_clean = accession_numbers[i].replace("-", "")
            doc_url = f"https://www.sec.gov/Archives/edgar/data/{cik_int}/{acc_clean}/{primary_docs[i]}"
            results.append({
                "form": form,
                "filing_date": filing_dates[i] if i < len(filing_dates) else None,
                "report_date": report_dates[i] if i < len(report_dates) else None,
                "url": doc_url
            })
            if len(results) >= limit:
                break

    return {
        "status": "success",
        "ticker": ticker.upper(),
        "company_name": data.get("name"),
        "count": len(results),
        "filings": results
    }


def get_concept(ticker: str, concept: str = "Revenues", taxonomy: str = "us-gaap") -> Dict[str, Any]:
    """Retrieves 10-K XBRL reported numerical facts for a US-GAAP concept."""
    cik = _resolve_cik(ticker)
    url = f"https://data.sec.gov/api/xbrl/companyconcept/CIK{cik}/{taxonomy}/{concept}.json"

    res = _SESSION.get(url, timeout=10)
    if res.status_code == 404:
        return {"status": "not_found", "message": f"Concept '{concept}' not found for '{ticker}'."}
    res.raise_for_status()

    data = res.json()
    units = data.get("units", {})
    records = units.get("USD", []) or next(iter(units.values()), [])

    # Filter for annual 10-K records with non-empty date and values
    period_fact_map = {}
    for r in records:
        if r.get("form") == "10-K" and r.get("val") is not None and r.get("end"):
            # Deduplicate by period_end (keeping the latest reported/amended value)
            period_fact_map[r["end"]] = {
                "fiscal_year": r.get("fy"),
                "period_end": r["end"],
                "value": r["val"]
            }

    sorted_facts = sorted(period_fact_map.values(), key=lambda x: x["period_end"])[-4:]

    return {
        "status": "success",
        "ticker": ticker.upper(),
        "concept": concept,
        "facts": sorted_facts
    }


def main():
    parser = argparse.ArgumentParser(description="SEC EDGAR CLI for Agents")
    parser.add_argument("--compact", action="store_true", help="Output compact JSON (token-efficient for LLMs)")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Subcommand: filings
    filings_parser = subparsers.add_parser("filings")
    filings_parser.add_argument("--ticker", required=True, help="Stock ticker (e.g. AAPL)")
    filings_parser.add_argument("--form", default="10-K", help="Form type (10-K, 10-Q, 8-K, ALL)")
    filings_parser.add_argument("--limit", type=int, default=5, help="Number of records")

    # Subcommand: concept
    concept_parser = subparsers.add_parser("concept")
    concept_parser.add_argument("--ticker", required=True, help="Stock ticker (e.g. AAPL)")
    concept_parser.add_argument("--concept", default="Revenues", help="XBRL tag (e.g. Revenues, NetIncomeLoss)")
    concept_parser.add_argument("--taxonomy", default="us-gaap", help="Taxonomy (default: us-gaap)")

    args = parser.parse_args()

    try:
        if args.command == "filings":
            output = get_filings(args.ticker, args.form, args.limit)
        elif args.command == "concept":
            output = get_concept(args.ticker, args.concept, args.taxonomy)
        else:
            output = {"error": "Invalid command"}

        if args.compact:
            print(json.dumps(output, separators=(",", ":")))
        else:
            print(json.dumps(output, indent=2))
    except Exception as exc:
        err = {"status": "error", "message": str(exc)}
        indent = None if getattr(args, "compact", False) else 2
        separators = (",", ":") if getattr(args, "compact", False) else None
        print(json.dumps(err, indent=indent, separators=separators), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
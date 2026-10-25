import json
import os
from typing import Any, Dict, List, Optional
import requests

BLS_API_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/"
_SESSION = requests.Session()

# Internal catalog mapping common research terms to official BLS Series IDs
BLS_SERIES_CATALOG = {
    "cpi_headline": {
        "id": "CUUR0000SA0",
        "name": "Consumer Price Index - All Urban Consumers (Unadjusted)",
    },
    "cpi_core": {
        "id": "CUUR0000SA0L1E",
        "name": "Core CPI (All Items Less Food and Energy)",
    },
    "unemployment_rate": {
        "id": "LNS14000000",
        "name": "Civilian Unemployment Rate (Seasonally Adjusted)",
    },
    "labor_force_participation": {
        "id": "LNS11300000",
        "name": "Labor Force Participation Rate",
    },
    "employment_cost_index": {
        "id": "CIU1010000000000A",
        "name": "Employment Cost Index - Total Compensation (Private)",
    },
    "avg_hourly_earnings_private": {
        "id": "CES0500000003",
        "name": "Average Hourly Earnings of All Employees (Total Private)",
    },
    "nonfarm_payroll": {
        "id": "CES0000000001",
        "name": "Total Nonfarm Employment",
    },
}


def _safe_float(val: Any) -> Any:
    """Parse string representations of numbers to float/int to save tokens and ease LLM calculations."""
    if val is None or val == "-":
        return None
    try:
        f = float(val)
        return int(f) if f.is_integer() else f
    except (ValueError, TypeError):
        return val


def query_bls_data(
    series_keys_or_ids: List[str],
    start_year: str,
    end_year: str,
    api_key: Optional[str] = None,
    include_calculations: bool = True,
    latest_n: Optional[int] = None,
    compact: bool = True,
) -> Dict[str, Any]:
    """Agent tool: Queries the BLS Public Data API v2.0 for multiple time series
    and formats the output for token-efficient market analysis.

    Catalog keys supported:
      - 'cpi_headline', 'cpi_core', 'unemployment_rate', 'labor_force_participation',
        'employment_cost_index', 'avg_hourly_earnings_private', 'nonfarm_payroll'.
      - Raw BLS series IDs (e.g., 'CUUR0000SA0') can also be passed.

    Args:
        series_keys_or_ids: List of catalog keys or series IDs (up to 50).
        start_year: 4-digit start year (e.g. '2024'). BLS max range is 10 years per query.
        end_year: 4-digit end year (e.g. '2026').
        api_key: Optional BLS API Key (falls back to BLS_API_KEY environment variable).
        include_calculations: Include 1-month and 12-month percentage changes.
        latest_n: Optional limit to return only the N most recent observations per series.
        compact: If True, uses columnar format ('headers' and 'rows') which saves 40-60% tokens.

    Returns:
        Dict with status, timeframe, and formatted series data.
    """
    key = api_key or os.getenv("BLS_API_KEY")
    if not key:
        return {
            "status": "ERROR",
            "message": "Missing BLS API Key. Set BLS_API_KEY environment variable or pass api_key.",
        }

    # Early validation: BLS v2 allows a max span of 10 consecutive years (span <= 9)
    try:
        s_yr, e_yr = int(start_year), int(end_year)
        if abs(e_yr - s_yr) > 9:
            return {
                "status": "ERROR",
                "message": f"BLS API limit exceeded: span between start_year ({start_year}) and end_year ({end_year}) cannot exceed 10 years.",
            }
    except ValueError:
        return {
            "status": "ERROR",
            "message": "start_year and end_year must be valid 4-digit integers.",
        }

    # 1. Resolve convenience names to BLS Series IDs & deduplicate
    resolved_ids: List[str] = []
    id_labels: Dict[str, str] = {}

    for item in series_keys_or_ids:
        k = item.lower()
        if k in BLS_SERIES_CATALOG:
            meta = BLS_SERIES_CATALOG[k]
            sid = meta["id"]
            label = meta["name"]
        else:
            sid = item.upper()
            label = sid

        if sid not in id_labels:
            resolved_ids.append(sid)
            id_labels[sid] = label

    # 2. Build the POST payload for the Multiple Series endpoint
    payload = {
        "seriesid": resolved_ids[:50],  # BLS v2.0 caps at 50 per request
        "startyear": str(start_year),
        "endyear": str(end_year),
        "catalog": False,
        "calculations": include_calculations,
        "annualaverage": False,
        "registrationkey": key,
    }

    # 3. Execute request using persistent session & native json serialization
    try:
        response = _SESSION.post(BLS_API_URL, json=payload, timeout=12)
        response.raise_for_status()
        raw_result = response.json()
    except requests.exceptions.RequestException as e:
        return {"status": "ERROR", "message": f"Network error contacting BLS API: {e}"}

    if raw_result.get("status") != "REQUEST_SUCCEEDED":
        return {
            "status": "FAILED",
            "message": raw_result.get("message", ["Unknown API error"]),
        }

    # 4. Format the output to save tokens for the LLM context window
    headers = ["period", "value"]
    if include_calculations:
        headers.extend(["pct_1m", "pct_12m"])

    condensed_data: Dict[str, Any] = {
        "status": "SUCCESS",
        "timeframe": f"{start_year}-{end_year}",
        "series": {},
    }

    for series_obj in raw_result.get("Results", {}).get("series", []):
        s_id = series_obj.get("seriesID")
        data_entries = series_obj.get("data", [])

        if latest_n is not None and latest_n > 0:
            data_entries = data_entries[:latest_n]

        if compact:
            rows = []
            for obs in data_entries:
                period_str = f"{obs.get('year')}-{obs.get('period')}"
                val = _safe_float(obs.get("value"))
                row = [period_str, val]
                if include_calculations:
                    pct = obs.get("calculations", {}).get("pct_changes", {})
                    row.append(_safe_float(pct.get("1")))
                    row.append(_safe_float(pct.get("12")))
                rows.append(row)

            condensed_data["series"][s_id] = {
                "name": id_labels.get(s_id, s_id),
                "headers": headers,
                "rows": rows,
            }
        else:
            observations = []
            for obs in data_entries:
                clean_entry = {
                    "period": f"{obs.get('year')}-{obs.get('period')}",
                    "value": _safe_float(obs.get("value")),
                }
                if include_calculations and "calculations" in obs:
                    pct_changes = obs["calculations"].get("pct_changes", {})
                    clean_entry["pct_12m"] = _safe_float(pct_changes.get("12"))
                    clean_entry["pct_1m"] = _safe_float(pct_changes.get("1"))
                observations.append(clean_entry)

            condensed_data["series"][s_id] = {
                "name": id_labels.get(s_id, s_id),
                "data": observations,
            }

    return condensed_data


# --- Example Local Test Execution ---
if __name__ == "__main__":
    # Test query requesting both CPI and Unemployment
    test_result = query_bls_data(
        series_keys_or_ids=["cpi_headline", "unemployment_rate"],
        start_year="2024",
        end_year="2026",
        api_key="7fd42d1848574d85a5d3353dce7d8c48",
    )

    print(json.dumps(test_result, indent=2))
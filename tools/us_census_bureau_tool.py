#!/usr/bin/env python3
"""
US Census Bureau Data Retrieval Tool.
Optimized for AI agent token efficiency, execution speed, and low resource overhead.

API Key Note:
    The US Census API requires a free API key (available at https://api.census.gov/data/key_signup.html).
    Pass via `--key <KEY>` or set the `CENSUS_API_KEY` environment variable.

Usage:
    python us_census_bureau_tool.py --limit 3
    python us_census_bureau_tool.py --compact --limit 5
    python us_census_bureau_tool.py --geo "state:06"  # California
    python us_census_bureau_tool.py --save census_data.json --limit 10
"""

import argparse
import json
import os
import sys
from typing import Any, Dict, List, Optional
import requests

# Curated alias dictionary for common Census variables to save LLM tokens and clarify meaning
DEFAULT_VARIABLES: Dict[str, str] = {
    "NAME": "name",
    "B01001_001E": "population",
    "B19013_001E": "median_income",
    "B25077_001E": "median_home_value",
}

DEFAULT_BASE_URL = "https://api.census.gov/data/2022/acs/acs5"


class CensusAPIError(Exception):
    """Custom exception for Census Bureau API errors."""
    pass


def fetch_census_data(
    variables: Optional[Dict[str, str]] = None,
    geo_for: str = "state:*",
    geo_in: Optional[str] = None,
    vintage_url: str = DEFAULT_BASE_URL,
    api_key: Optional[str] = None,
    timeout: float = 15.0,
) -> List[Dict[str, Any]]:
    """
    Fetches and transforms Census data into token-efficient dictionary records.

    Raises:
        CensusAPIError: When the Census API returns an HTML error page (e.g. missing API key).
        requests.RequestException: On connection failures or HTTP errors.
    """
    if variables is None:
        variables = DEFAULT_VARIABLES

    resolved_key = api_key or os.environ.get("CENSUS_API_KEY")
    get_param = ",".join(variables.keys())

    params: Dict[str, str] = {"get": get_param, "for": geo_for}
    if geo_in:
        params["in"] = geo_in
    if resolved_key:
        params["key"] = resolved_key

    with requests.Session() as session:
        # Don't silently follow redirect to missing_key.html without informing the caller
        response = session.get(
            vintage_url,
            params=params,
            timeout=timeout,
            headers={"User-Agent": "CensusDataTool/1.0"}
        )

        # Detect Census API missing key / redirect error
        if "missing_key" in response.url or response.headers.get("X-DataWebAPI-KeyError") == "1":
            raise CensusAPIError(
                "US Census Bureau requires a free API key. "
                "Register at https://api.census.gov/data/key_signup.html and provide via "
                "--key <KEY> or set the CENSUS_API_KEY environment variable."
            )

        response.raise_for_status()

        try:
            raw_data = response.json()
        except ValueError as exc:
            if "<html" in response.text.lower():
                raise CensusAPIError(
                    f"Census API returned HTML instead of JSON: {response.text[:200].strip()}"
                ) from exc
            raise

    if not raw_data or len(raw_data) < 2:
        return []

    headers = raw_data[0]
    rows = raw_data[1:]

    # Map raw Census variable codes to clean, agent-readable keys
    alias_headers = [variables.get(h, h.lower()) for h in headers]

    GEO_KEYS = {"state", "county", "tract", "block group", "place", "zip code tabulation area"}

    results: List[Dict[str, Any]] = []
    for row in rows:
        record: Dict[str, Any] = {}
        for k, v in zip(alias_headers, row):
            # Preserve leading zero strings on geographic codes (e.g. FIPS codes like state "06")
            if k in GEO_KEYS or (isinstance(v, str) and len(v) > 1 and v.startswith("0")):
                record[k] = v
            elif v is not None and str(v).lstrip("-").isdigit():
                record[k] = int(v)
            else:
                record[k] = v
        results.append(record)

    return results


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fetch US Census Bureau ACS5 statistics with token-efficient output."
    )
    parser.add_argument(
        "--geo",
        default="state:*",
        help="Geography query specification (default: 'state:*').",
    )
    parser.add_argument(
        "--key",
        default=None,
        help="US Census Bureau API key (or set CENSUS_API_KEY env variable).",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Maximum records to return (conserves AI context window tokens).",
    )
    parser.add_argument(
        "--compact",
        action="store_true",
        help="Output minified JSON without whitespace (maximum token efficiency).",
    )
    parser.add_argument(
        "--save",
        type=str,
        default=None,
        help="Optional path to save data locally instead of dumping to stdout.",
    )

    args = parser.parse_args()

    try:
        data = fetch_census_data(geo_for=args.geo, api_key=args.key)
        if args.limit:
            data = data[: args.limit]

        # Token efficiency formatting
        json_kwargs: Dict[str, Any] = (
            {"separators": (",", ":")} if args.compact else {"indent": 2}
        )

        formatted_json = json.dumps(data, **json_kwargs)

        if args.save:
            with open(args.save, "w", encoding="utf-8") as f:
                f.write(formatted_json)
            print(f"Saved {len(data)} records to {args.save}", file=sys.stderr)
        else:
            print(formatted_json)

    except CensusAPIError as e:
        print(f"Census API Configuration Notice: {e}", file=sys.stderr)
        sys.exit(2)
    except requests.exceptions.RequestException as e:
        print(f"Network error fetching Census data: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
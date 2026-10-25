"""
========================================================================================
GOOGLE TRENDS AGENT TOOL MANUAL (pytrends_tool.py)
========================================================================================

ROLE & PURPOSE:
This tool provides an AI agent with access to Google Trends data. It measures consumer
search interest, demand shifts, regional breakdowns, and emerging search queries for market
research, brand comparison, and trend analysis.

CORE USE CASES FOR THE AGENT:
1. Demand & Sentiment Tracking:
   - Quantify consumer interest over time for travel/accommodations (e.g. "Airbnb" vs "hotel").
   - Pinpoint seasonal spikes (summer vacations, holiday getaways, long weekends).
2. Granular Regional & City Analysis:
   - Identify which provinces, states, or metropolitan regions have the highest search density.
   - Example: Comparing "Airbnb" interest across Philippine regions (NCR, Cebu, Davao).
3. Local City Scoping:
   - Scope searches down to specific sub-divisions or cities using ISO 3166-2 sub-codes 
     (e.g., 'PH-00' for Metro Manila, 'PH-07' for Cebu, 'US-NY' for New York).
4. Discovering Related & Emerging Queries:
   - Uncover rising search queries to discover emerging competitor brands, consumer concerns, 
     or trending travel spots (e.g., "Airbnb Tagaytay with pool").
5. Competitor Benchmarking:
   - Compare up to 5 simultaneous terms to evaluate relative market share of search.

FUNCTIONS EXPOSED:
1. `get_interest_over_time(keywords, geo, timeframe, category, latest_n)`
   - Returns normalized search interest (0-100) indexed by date.
   - `latest_n` protects the agent's context window by limiting historical timepoints.
2. `get_interest_by_region(keywords, geo, timeframe, resolution, top_n)`
   - Returns ranked sub-regions or cities by search interest volume.
3. `get_related_queries(keyword, geo, timeframe, top_n)`
   - Returns 'top' and 'rising' search queries associated with a target term.

GEOGRAPHIC FILTERING ('geo'):
- Worldwide: "" or "worldwide" or "global"
- Country Level: 2-letter ISO code (e.g., "PH", "US", "JP", "GB")
- City / Sub-region:
  - Alias shortcuts: "manila", "metro manila", "cebu", "davao", "new york", "los angeles"
  - Direct ISO 3166-2 / DMA codes: "PH-00" (Metro Manila), "PH-07" (Central Visayas), "US-CA"

AGENT EXECUTION EXAMPLES (SHELL ONE-LINERS):
1. Interest Over Time (Manila):
   python -c "import pytrends_tool, json; print(json.dumps(pytrends_tool.get_interest_over_time(['Airbnb', 'hotel'], geo='manila', latest_n=10)))"

2. Regional Breakdown (Philippines):
   python -c "import pytrends_tool, json; print(json.dumps(pytrends_tool.get_interest_by_region(['Airbnb'], geo='PH', top_n=5)))"

3. Related Emerging Queries:
   python -c "import pytrends_tool, json; print(json.dumps(pytrends_tool.get_related_queries('Airbnb', geo='PH', top_n=5)))"

IMPORTANT AGENT OPERATIONAL RULES:
- Never exceed 5 keywords per query (Google Trends hard limit).
- Google Trends aggressively rate-limits (HTTP 429). Do NOT fire multiple consecutive requests
  unnecessarily. Request only the specific function needed.
========================================================================================
"""

import logging
import time
from typing import Any, Dict, List, Optional
import pandas as pd
from pytrends.request import TrendReq
from pytrends.exceptions import ResponseError

logger = logging.getLogger(__name__)

# Common geographical aliases mapping agent-friendly names to ISO 3166-2 sub-division codes
GEO_ALIASES: Dict[str, str] = {
    "world": "",
    "worldwide": "",
    "global": "",
    "philippines": "PH",
    "manila": "PH-00",        # Metro Manila / National Capital Region (NCR)
    "metro manila": "PH-00",
    "ncr": "PH-00",
    "cebu": "PH-07",          # Central Visayas (includes Cebu)
    "davao": "PH-11",         # Davao Region
    "united states": "US",
    "us": "US",
    "new york": "US-NY",
    "california": "US-CA",
    "los angeles": "US-CA-803", # DMA code
}


def _get_trend_client(hl: str = "en-US", tz: int = 360, timeout: int = 15) -> TrendReq:
    """Initialize a TrendReq client configured with backoff and retry settings."""
    return TrendReq(
        hl=hl,
        tz=tz,
        timeout=(timeout, timeout + 10),
        retries=2,
        backoff_factor=1.0,
    )


def _resolve_geo(geo: Optional[str]) -> str:
    """Normalize and resolve common geo strings, country codes, or sub-regions."""
    if not geo:
        return ""
    normalized = geo.strip().lower()
    return GEO_ALIASES.get(normalized, geo.strip().upper())


def get_interest_over_time(
    keywords: List[str],
    geo: Optional[str] = "",
    timeframe: str = "today 12-m",
    category: int = 0,
    latest_n: Optional[int] = 20,
) -> Dict[str, Any]:
    """
    Fetch historical search interest over time for given keywords.

    Args:
        keywords: List of up to 5 keywords (e.g. ['Airbnb', 'hotel']).
        geo: Geographic location. Empty string ('') for Worldwide, 2-letter ISO country
             code (e.g. 'PH', 'US'), or ISO 3166-2 sub-division/city code (e.g. 'PH-00' for Metro Manila).
        timeframe: Google Trends timeframe string (e.g., 'today 1-m', 'today 3-m', 'today 12-m', 'now 7-d', 'all').
        category: Search category ID (default 0 for All Categories; 67 for Travel).
        latest_n: Limit to the latest N time points to conserve token usage (default 20, None for all).

    Returns:
        Structured dictionary with status, metadata, and token-optimized timeseries data.
    """
    if not keywords:
        return {"status": "error", "error_type": "ValidationError", "message": "At least one keyword is required."}

    if len(keywords) > 5:
        return {
            "status": "error",
            "error_type": "ValidationError",
            "message": "Google Trends supports a maximum of 5 keywords per comparison query.",
        }

    resolved_geo = _resolve_geo(geo)

    try:
        pytrends = _get_trend_client()
        pytrends.build_payload(
            kw_list=keywords,
            cat=category,
            timeframe=timeframe,
            geo=resolved_geo,
            gprop="",
        )

        df = pytrends.interest_over_time()

        if df.empty:
            return {
                "status": "empty",
                "message": f"No search interest data returned for keywords {keywords} in geo '{resolved_geo}'.",
                "data": [],
            }

        # Drop the boolean 'isPartial' column if present to save tokens
        if "isPartial" in df.columns:
            df = df.drop(columns=["isPartial"])

        # Slice latest records if requested to minimize context token overhead
        if latest_n and latest_n > 0:
            df = df.tail(latest_n)

        # Convert index to ISO date strings and map to dictionary list
        df.index = df.index.strftime("%Y-%m-%d")
        timeline = []
        for date_str, row in df.iterrows():
            record = {"date": date_str}
            for kw in keywords:
                if kw in row:
                    record[kw] = int(row[kw])
            timeline.append(record)

        return {
            "status": "success",
            "geo": resolved_geo or "Worldwide",
            "timeframe": timeframe,
            "count": len(timeline),
            "timeline": timeline,
        }

    except ResponseError as e:
        status_code = getattr(e, "response", None) and getattr(e.response, "status_code", None)
        if status_code == 429:
            return {
                "status": "error",
                "error_type": "RateLimitExceeded",
                "message": "Google Trends rate limit hit (HTTP 429). Please wait before re-querying or use broader terms.",
            }
        return {
            "status": "error",
            "error_type": "ResponseError",
            "message": f"Google Trends API error: {str(e)}",
        }
    except Exception as e:
        return {
            "status": "error",
            "error_type": "UnexpectedError",
            "message": f"Failed to retrieve interest over time: {str(e)}",
        }


def get_interest_by_region(
    keywords: List[str],
    geo: Optional[str] = "PH",
    timeframe: str = "today 12-m",
    resolution: str = "REGION",
    top_n: int = 10,
) -> Dict[str, Any]:
    """
    Fetch geographical search interest breakdown across sub-regions, cities, or countries.

    Args:
        keywords: List of up to 5 keywords (e.g. ['Airbnb']).
        geo: Two-letter ISO country code (e.g. 'PH', 'US') or empty for world view.
        timeframe: Timeframe filter (e.g., 'today 12-m').
        resolution: Granularity level: 'REGION' (provinces/states/regions),
                    'CITY' (metropolitan/city level where available), or 'COUNTRY'.
        top_n: Number of top regions to return (default 10).

    Returns:
        Structured dictionary containing top ranked geographical regions by interest.
    """
    if not keywords:
        return {"status": "error", "error_type": "ValidationError", "message": "At least one keyword is required."}

    resolved_geo = _resolve_geo(geo)

    try:
        pytrends = _get_trend_client()
        pytrends.build_payload(
            kw_list=keywords,
            timeframe=timeframe,
            geo=resolved_geo,
        )

        df = pytrends.interest_by_region(
            resolution=resolution.upper(),
            inc_low_vol=True,
            inc_geo_code=True,
        )

        if df.empty:
            return {
                "status": "empty",
                "message": f"No regional data found for keywords {keywords} in geo '{resolved_geo}'.",
                "regions": [],
            }

        # Primary sort keyword is the first keyword in the list
        primary_kw = keywords[0]
        if primary_kw in df.columns:
            df = df.sort_values(by=primary_kw, ascending=False)

        top_df = df.head(top_n)

        results = []
        for region_name, row in top_df.iterrows():
            item: Dict[str, Any] = {"region": str(region_name)}
            if "geoCode" in row:
                item["geo_code"] = str(row["geoCode"])
            for kw in keywords:
                if kw in row:
                    item[kw] = int(row[kw])
            results.append(item)

        return {
            "status": "success",
            "geo": resolved_geo or "Worldwide",
            "resolution": resolution.upper(),
            "count": len(results),
            "regions": results,
        }

    except ResponseError as e:
        status_code = getattr(e, "response", None) and getattr(e.response, "status_code", None)
        if status_code == 429:
            return {
                "status": "error",
                "error_type": "RateLimitExceeded",
                "message": "Google Trends rate limit hit (HTTP 429). Please back off before retrying.",
            }
        return {
            "status": "error",
            "error_type": "ResponseError",
            "message": f"Google Trends API error: {str(e)}",
        }
    except Exception as e:
        return {
            "status": "error",
            "error_type": "UnexpectedError",
            "message": f"Failed to retrieve regional interest: {str(e)}",
        }


def get_related_queries(
    keyword: str,
    geo: Optional[str] = "PH",
    timeframe: str = "today 12-m",
    top_n: int = 5,
) -> Dict[str, Any]:
    """
    Fetch top and rising search queries associated with a keyword.

    Args:
        keyword: Target search term (single keyword).
        geo: Two-letter ISO country code or regional code (e.g. 'PH', 'PH-00').
        timeframe: Timeframe filter (e.g. 'today 12-m').
        top_n: Max items to return for both 'top' and 'rising' lists to save tokens.

    Returns:
        Structured dictionary with top and rising related queries.
    """
    if not keyword or not keyword.strip():
        return {"status": "error", "error_type": "ValidationError", "message": "A non-empty keyword is required."}

    resolved_geo = _resolve_geo(geo)

    try:
        pytrends = _get_trend_client()
        pytrends.build_payload(
            kw_list=[keyword.strip()],
            timeframe=timeframe,
            geo=resolved_geo,
        )

        related = pytrends.related_queries()
        kw_data = related.get(keyword.strip(), {})

        def _clean_subtable(sub_df: Optional[pd.DataFrame]) -> List[Dict[str, Any]]:
            if sub_df is None or sub_df.empty:
                return []
            cleaned = []
            for _, row in sub_df.head(top_n).iterrows():
                cleaned.append({
                    "query": str(row.get("query", "")),
                    "value": int(row.get("value", 0)) if pd.notnull(row.get("value")) else None,
                })
            return cleaned

        top_queries = _clean_subtable(kw_data.get("top"))
        rising_queries = _clean_subtable(kw_data.get("rising"))

        return {
            "status": "success",
            "keyword": keyword,
            "geo": resolved_geo or "Worldwide",
            "top_queries": top_queries,
            "rising_queries": rising_queries,
        }

    except ResponseError as e:
        status_code = getattr(e, "response", None) and getattr(e.response, "status_code", None)
        if status_code == 429:
            return {
                "status": "error",
                "error_type": "RateLimitExceeded",
                "message": "Google Trends rate limit hit (HTTP 429).",
            }
        return {
            "status": "error",
            "error_type": "ResponseError",
            "message": f"Google Trends API error: {str(e)}",
        }
    except Exception as e:
        return {
            "status": "error",
            "error_type": "UnexpectedError",
            "message": f"Failed to retrieve related queries: {str(e)}",
        }


if __name__ == "__main__":
    import json

    print("--- Test 1: Interest Over Time (Metro Manila) ---")
    res1 = get_interest_over_time(keywords=["Airbnb", "hotel"], geo="manila", latest_n=5)
    print(json.dumps(res1, indent=2))

    print("\n--- Test 2: Regional Interest in Philippines ---")
    res2 = get_interest_by_region(keywords=["Airbnb"], geo="PH", top_n=5)
    print(json.dumps(res2, indent=2))

    print("\n--- Test 3: Related Queries for 'Airbnb' in Philippines ---")
    res3 = get_related_queries(keyword="Airbnb", geo="PH", top_n=5)
    print(json.dumps(res3, indent=2))

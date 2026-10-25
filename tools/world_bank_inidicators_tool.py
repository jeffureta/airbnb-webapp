import json
from typing import Optional
import requests

def get_world_bank_indicator_data(
    indicator: str,
    country: str = "all",
    date_range: Optional[str] = None,
    limit: int = 50,
    drop_nulls: bool = True
) -> str:
    """
    Fetch economic and development indicator data from the World Bank API as compact JSON.
    Does NOT require an API key.

    Args:
        indicator: The World Bank indicator code (e.g., 'SP.POP.TOTL' for population,
                   'NY.GDP.MKTP.CD' for GDP, 'FP.CPI.TOTL.ZG' for inflation).
        country: Two- or three-letter ISO country code (e.g., 'US', 'PHL', 'WLD'),
                 or semicolon-delimited list ('US;CN;GB'). Defaults to 'all'.
        date_range: Year or range in 'YYYY' or 'YYYY:YYYY' format (e.g., '2015:2023').
        limit: Max number of observations to return (default: 50, max: 1000).
        drop_nulls: If True, filters out historical records where the indicator value is null.

    Returns:
        Compact JSON string containing status, indicator info, and observation records.
    """
    clean_indicator = (indicator or "").strip()
    clean_country = (country or "").strip()

    if not clean_indicator:
        return json.dumps({"status": "error", "message": "Indicator code cannot be empty."})
    if not clean_country:
        clean_country = "all"

    # Enforce valid limit boundaries
    bounded_limit = max(1, min(limit, 1000))
    base_url = f"https://api.worldbank.org/v2/country/{clean_country}/indicator/{clean_indicator}"

    params = {
        "format": "json",
        "per_page": bounded_limit
    }
    if date_range:
        params["date"] = date_range.strip()

    try:
        # (connect_timeout, read_timeout)
        response = requests.get(base_url, params=params, timeout=(4, 10))
        response.raise_for_status()

        try:
            raw_data = response.json()
        except Exception:
            return json.dumps({
                "status": "error",
                "message": "Received non-JSON response from World Bank API."
            })

        # Handle World Bank error responses (often returned as [{'message': [{'id': ..., 'value': ...}]}])
        if not isinstance(raw_data, list) or len(raw_data) < 2:
            error_message = "No data returned or invalid indicator/country code."
            if isinstance(raw_data, list) and len(raw_data) > 0 and isinstance(raw_data[0], dict):
                msg_list = raw_data[0].get("message")
                if isinstance(msg_list, list) and len(msg_list) > 0 and isinstance(msg_list[0], dict):
                    error_message = msg_list[0].get("value", error_message)
            return json.dumps({"status": "error", "message": error_message})

        pagination_meta = raw_data[0] if isinstance(raw_data[0], dict) else {}
        entries = raw_data[1] if isinstance(raw_data[1], list) else []

        if not entries:
            return json.dumps({
                "status": "success",
                "message": "Query succeeded, but no records were found.",
                "total_available": 0,
                "data": []
            })

        # Resolve indicator label once at top level to avoid duplicating in every row
        indicator_name = None
        for row in entries:
            if isinstance(row, dict) and "indicator" in row:
                indicator_name = row["indicator"].get("value")
                if indicator_name:
                    break

        flattened_records = []
        for row in entries:
            if not isinstance(row, dict):
                continue
            val = row.get("value")
            if drop_nulls and val is None:
                continue

            flattened_records.append({
                "country": row.get("countryiso3code") or row.get("country", {}).get("value"),
                "year": row.get("date"),
                "value": val
            })

        return json.dumps({
            "status": "success",
            "indicator_id": clean_indicator,
            "indicator_name": indicator_name or clean_indicator,
            "returned_count": len(flattened_records),
            "total_available_in_source": pagination_meta.get("total"),
            "data": flattened_records
        })

    except requests.exceptions.Timeout:
        return json.dumps({"status": "error", "message": "Request to World Bank API timed out."})
    except requests.exceptions.HTTPError as e:
        status_code = response.status_code if 'response' in locals() and response is not None else "unknown"
        return json.dumps({"status": "error", "message": f"HTTP error {status_code}: {str(e)}"})
    except requests.exceptions.RequestException as e:
        return json.dumps({"status": "error", "message": f"Network error: {str(e)}"})
    except Exception as e:
        return json.dumps({"status": "error", "message": f"Unexpected error: {str(e)}"})
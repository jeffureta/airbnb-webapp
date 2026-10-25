import os
import requests
from typing import Dict, Any, Optional

def fetch_fred_observations(
    series_id: str,
    observation_start: Optional[str] = None,
    observation_end: Optional[str] = None,
    frequency: Optional[str] = None,
    limit: int = 100
) -> Dict[str, Any]:
    """
    Fetch economic time-series observations from the St. Louis Fed (FRED) API.
    
    Args:
        series_id: The FRED series identifier (e.g., 'UNRATE' for unemployment, 
                   'GDP' for gross domestic product, 'CPIAUCSL' for CPI).
        observation_start: Start date in 'YYYY-MM-DD' format. Optional.
        observation_end: End date in 'YYYY-MM-DD' format. Optional.
        frequency: Aggregation frequency like 'm' (monthly), 'q' (quarterly), 
                   'a' (annual). Optional.
        limit: Max observations to return (default: 100, max: 1000) to conserve context tokens.
        
    Returns:
        A dictionary containing status, series_id, count, and list of date-value pairs,
        or an error message.
    """
    api_key = os.getenv("343785b162e22af7c7373bce0c66ac5b")
    if not api_key:
        return {"error": "FRED_API_KEY environment variable is not set."}

    endpoint = "https://api.stlouisfed.org/fred/series/observations"
    
    params = {
        "series_id": series_id.strip(),
        "api_key": api_key,
        "file_type": "json",
        "sort_order": "desc",  # Retrieve newest data first
        "limit": min(limit, 1000)
    }

    if observation_start:
        params["observation_start"] = observation_start
    if observation_end:
        params["observation_end"] = observation_end
    if frequency:
        params["frequency"] = frequency

    try:
        response = requests.get(endpoint, params=params, timeout=10)
        
        if response.status_code == 400:
            error_data = response.json()
            return {"error": f"Invalid request: {error_data.get('error_message', 'Bad Request')}"}
        
        response.raise_for_status()
        data = response.json()

        # Clean FRED's "." placeholder for missing values into None
        cleaned_observations = []
        for obs in data.get("observations", []):
            raw_val = obs.get("value")
            cleaned_val = None if raw_val == "." else float(raw_val)
            cleaned_observations.append({
                "date": obs.get("date"),
                "value": cleaned_val
            })

        return {
            "status": "success",
            "series_id": series_id,
            "count": len(cleaned_observations),
            "observations": cleaned_observations
        }

    except requests.exceptions.RequestException as e:
        return {"error": f"Network or HTTP error fetching FRED data: {str(e)}"}
    except ValueError as e:
        return {"error": f"Data parsing error: {str(e)}"}
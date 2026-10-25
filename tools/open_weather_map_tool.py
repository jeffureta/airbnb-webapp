#!/usr/bin/env python3
"""
========================================================================================
OPENWEATHERMAP MULTI-SCALE AGENT TOOL MANUAL (open_weather_map_tool.py)
========================================================================================

ROLE & PURPOSE:
This tool equips AI agents with high-performance, token-efficient weather data across any
geographic scale:
  - Wide Area / Macro: Continents (e.g. Europe, Asia), Regions (e.g. Southeast Asia),
    Countries (e.g. Philippines, Japan, United States), or multi-city cluster zones.
  - Granular / Micro: Specific cities (e.g. Manila, Tagaytay, Cebu), postal/ZIP codes,
    or exact GPS coordinates (lat/lon).

CORE AGENT USE CASES:
1. Staycation & Vacation Planning (Micro & Regional):
   - Scope down to individual cities or travel hotspots (e.g. "Baguio, PH", "Tagaytay, PH").
   - Assess 1-to-5 day forward forecasts for precipitation, cloud cover, and min/max temperatures.
2. Macro / Wide-Area Market Research:
   - Query entire countries (e.g. "Philippines", "Japan", "United Kingdom") or multi-country
     regions (e.g. "Southeast Asia", "Scandinavia") to evaluate macro travel climate and weather seasonality.
   - Detect regional disruptions (typhoon seasons, monsoons, regional heatwaves) across major hubs.
3. Area Scanning (Cluster / Surrounding Cities):
   - Use `find_nearby_weather(lat, lon, cnt=5)` or `--nearby` to scan multiple surrounding
     municipalities around a target destination in a single network roundtrip.
4. Token-Efficient Batch Ingestion:
   - Direct coordinate bypass (skips geocoding).
   - In-memory LRU resolution cache.
   - Compact minified JSON (`--compact`) to preserve context tokens.

FUNCTIONS EXPOSED TO AGENTS:
1. `get_current_weather(location=None, lat=None, lon=None, zip_code=None, units='metric', compact=False, as_json=False)`
   - Scopes to a city, country, postal code, or exact coordinates.
   - For recognized regions (e.g., 'Southeast Asia'), returns multi-city weather across key hubs.
2. `get_forecast(location=None, lat=None, lon=None, days=3, units='metric', compact=False, as_json=False)`
   - Returns a condensed daily aggregated forecast (min/max temp, dominant condition, rain probability).
3. `find_nearby_weather(location=None, lat=None, lon=None, cnt=5, units='metric', compact=False, as_json=False)`
   - Scans surrounding cities within the radius of a focal point.
4. `get_openai_tool_schema()`
   - Returns complete function schemas for tool-calling LLMs (OpenAI, Gemini, Anthropic).

AGENT EXECUTION EXAMPLES (SHELL ONE-LINERS):
1. Granular City Query (Manila, Philippines):
   python tools/open_weather_map_tool.py --location "Manila, Philippines" --compact

2. Macro Country Query (Philippines):
   python tools/open_weather_map_tool.py --location "Philippines" --compact

3. Wide-Area Regional Query (Southeast Asia Hubs):
   python tools/open_weather_map_tool.py --location "Southeast Asia" --compact

4. 3-Day Forecast for Hotspot:
   python tools/open_weather_map_tool.py --location "Tagaytay, PH" --forecast --days 3

5. Scan 5 Surrounding Municipalities Around Metro Manila:
   python tools/open_weather_map_tool.py --location "Manila, PH" --nearby --count 5 --compact

6. Postal Code Scoping:
   python tools/open_weather_map_tool.py --zip "1000,PH" --compact

7. Direct GPS Coordinates (Zero Geocoding Overhead):
   python tools/open_weather_map_tool.py --lat 14.5995 --lon 120.9842 --compact

OPERATIONAL RULES FOR CALLING AGENTS:
- For listings with known GPS coordinates, ALWAYS pass `--lat` and `--lon` directly.
- Use `--compact` when piping tool output into prompting LLMs to reduce token consumption.
- If an agent needs weather across an entire country, pass the country name (e.g., `--location "Philippines"`).
========================================================================================
"""

from __future__ import annotations

import argparse
from functools import lru_cache
import json
import os
import sys
from typing import Any, Dict, List, Optional, Tuple, Union
import requests

DEFAULT_API_KEY = "63f1b30269bfa47bbe225e189c3ec586"

# Curated macro regions mapping to representative hubs for wide-area scanning
MACRO_REGIONS: Dict[str, List[str]] = {
    "southeast asia": ["Manila, PH", "Bangkok, TH", "Singapore, SG", "Kuala Lumpur, MY", "Jakarta, ID", "Hanoi, VN"],
    "east asia": ["Tokyo, JP", "Seoul, KR", "Beijing, CN", "Taipei, TW", "Hong Kong, HK"],
    "south asia": ["New Delhi, IN", "Mumbai, IN", "Colombo, LK", "Dhaka, BD"],
    "western europe": ["London, GB", "Paris, FR", "Berlin, DE", "Amsterdam, NL", "Madrid, ES"],
    "scandinavia": ["Oslo, NO", "Stockholm, SE", "Copenhagen, DK", "Helsinki, FI"],
    "north america": ["New York, US", "Los Angeles, US", "Toronto, CA", "Mexico City, MX"],
    "philippines": ["Manila, PH", "Cebu City, PH", "Davao, PH", "Baguio, PH", "Tagaytay, PH"],
}


class WeatherAPIError(Exception):
    """Custom diagnostic exception for AI agents."""

    def __init__(self, message: str, status_code: Optional[int] = None, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}

    def to_dict(self) -> Dict[str, Any]:
        result: Dict[str, Any] = {"error": self.message}
        if self.status_code is not None:
            result["status_code"] = self.status_code
        if self.details:
            result["details"] = self.details
        return result


class OpenWeatherTool:
    """High-performance, multi-scale weather tool for AI agents."""

    GEO_URL = "https://api.openweathermap.org/geo/1.0/direct"
    ZIP_URL = "https://api.openweathermap.org/geo/1.0/zip"
    CURRENT_WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"
    FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"
    FIND_URL = "https://api.openweathermap.org/data/2.5/find"

    def __init__(self, api_key: Optional[str] = None, units: str = "metric", timeout: float = 8.0):
        self.api_key = api_key or os.getenv("OPENWEATHER_API_KEY") or DEFAULT_API_KEY
        if not self.api_key:
            raise WeatherAPIError("OpenWeather API key must be provided or configured.")
        self.units = units
        self.timeout = timeout
        self.session = requests.Session()

    def close(self) -> None:
        """Close the persistent requests session."""
        self.session.close()

    def __enter__(self) -> OpenWeatherTool:
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        self.close()

    @lru_cache(maxsize=256)
    def _cached_geocode(self, location: str) -> Tuple[float, float, str]:
        """Resolve a city or country string into (lat, lon, resolved_name).

        Uses direct geocoding with intelligent fallback to direct weather lookup for countries.
        """
        loc_str = location.strip()
        params = {"q": loc_str, "limit": 3, "appid": self.api_key}

        try:
            response = self.session.get(self.GEO_URL, params=params, timeout=self.timeout)
            if response.status_code == 401:
                raise WeatherAPIError("Unauthorized: Invalid OpenWeather API key.", status_code=401)
            if response.status_code == 429:
                raise WeatherAPIError("Rate limited: OpenWeather API quota exceeded.", status_code=429)

            data = response.json() if response.status_code == 200 else []

            # If geocoding direct search returns records
            if isinstance(data, list) and len(data) > 0:
                # Check for country name match (e.g. user queried "Philippines" and geo returned Dubai street named Philippines)
                chosen = data[0]
                for item in data:
                    if item.get("country") and loc_str.lower() in [item.get("name", "").lower(), item.get("country", "").lower()]:
                        chosen = item
                        break

                # If the top result doesn't look like an actual country when a country was queried,
                # verify via weather endpoint fallback
                if chosen.get("country") == "AE" and "philippine" in loc_str.lower():
                    # Fallback to direct weather query
                    return self._fallback_weather_query(loc_str)

                name_parts = [chosen.get("name")]
                if chosen.get("state"):
                    name_parts.append(chosen.get("state"))
                if chosen.get("country"):
                    name_parts.append(chosen.get("country"))
                return float(chosen["lat"]), float(chosen["lon"]), ", ".join(filter(None, name_parts))

            # Fallback to direct weather query which handles countries and regions natively
            return self._fallback_weather_query(loc_str)

        except WeatherAPIError:
            raise
        except requests.exceptions.Timeout:
            raise WeatherAPIError(f"Geocoding request timed out after {self.timeout}s.", status_code=408)
        except requests.exceptions.RequestException as e:
            raise WeatherAPIError(f"Network error during geocoding: {str(e)}")

    def _fallback_weather_query(self, location: str) -> Tuple[float, float, str]:
        """Direct query to the weather endpoint to resolve broad geographic entities like countries."""
        res = self.session.get(self.CURRENT_WEATHER_URL, params={"q": location, "appid": self.api_key}, timeout=self.timeout)
        if res.status_code == 200:
            payload = res.json()
            coord = payload.get("coord", {})
            name = payload.get("name", location)
            country = payload.get("sys", {}).get("country", "")
            resolved = f"{name}, {country}" if country else name
            return float(coord["lat"]), float(coord["lon"]), resolved
        raise WeatherAPIError(f"Location '{location}' could not be resolved. Please verify name or coordinates.", status_code=404)

    @lru_cache(maxsize=128)
    def _geocode_zip(self, zip_code: str) -> Tuple[float, float, str]:
        """Resolves zip/postal code (e.g. '1000,PH' or '94107,US') into (lat, lon, resolved_name)."""
        params = {"zip": zip_code.strip(), "appid": self.api_key}
        res = self.session.get(self.ZIP_URL, params=params, timeout=self.timeout)
        if res.status_code == 200:
            d = res.json()
            return float(d["lat"]), float(d["lon"]), f"{d.get('name')}, {d.get('country')} ({d.get('zip')})"
        raise WeatherAPIError(f"Postal code '{zip_code}' could not be resolved.", status_code=404)

    def _resolve_coordinates(
        self,
        location: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        zip_code: Optional[str] = None,
    ) -> Tuple[float, float, str]:
        """Unified resolver handling GPS coordinates, postal codes, and city/country queries."""
        if lat is not None and lon is not None:
            return float(lat), float(lon), f"Coord({lat:.4f}, {lon:.4f})"
        if zip_code:
            return self._geocode_zip(zip_code)
        if location:
            return self._cached_geocode(location)
        raise WeatherAPIError("Must provide 'location', 'zip_code', or both 'lat' and 'lon'.")

    def _format_weather_dict(self, raw: Dict[str, Any], resolved_name: str, unit_system: str) -> Dict[str, Any]:
        """Transforms a raw OpenWeather payload into a token-efficient dictionary."""
        temp_unit = "°C" if unit_system == "metric" else "°F" if unit_system == "imperial" else "K"
        speed_unit = "m/s" if unit_system == "metric" else "mph" if unit_system == "imperial" else "m/s"
        weather_desc = raw["weather"][0]["description"].capitalize() if raw.get("weather") else "Unknown"

        return {
            "location": resolved_name or raw.get("name", "Unknown"),
            "lat": round(raw.get("coord", {}).get("lat", 0.0), 4),
            "lon": round(raw.get("coord", {}).get("lon", 0.0), 4),
            "condition": weather_desc,
            "temp": raw["main"]["temp"],
            "feels_like": raw["main"]["feels_like"],
            "temp_unit": temp_unit,
            "humidity_pct": raw["main"]["humidity"],
            "wind_speed": raw["wind"]["speed"],
            "wind_unit": speed_unit,
            "pressure_hpa": raw["main"]["pressure"],
            "clouds_pct": raw.get("clouds", {}).get("all", 0),
        }

    def get_current_weather(
        self,
        location: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        zip_code: Optional[str] = None,
        units: Optional[str] = None,
        compact: bool = False,
        as_json: bool = False,
    ) -> Union[Dict[str, Any], str]:
        """Fetch current weather for a city, country, macro-region, postal code, or exact coordinates."""
        unit_system = units or self.units

        # Check for predefined macro regions (e.g. 'Southeast Asia')
        if location and location.strip().lower() in MACRO_REGIONS:
            region_key = location.strip().lower()
            hubs = MACRO_REGIONS[region_key]
            results: List[Dict[str, Any]] = []
            for hub in hubs:
                try:
                    res = self.get_current_weather(location=hub, units=unit_system, as_json=False)
                    if isinstance(res, dict) and "error" not in res:
                        results.append(res)
                except Exception:
                    continue
            summary = {
                "macro_region": region_key.title(),
                "total_hubs": len(results),
                "hubs": results,
            }
            if as_json or compact:
                separators = (",", ":") if compact else None
                indent = None if compact else 2
                return json.dumps(summary, separators=separators, indent=indent)
            return summary

        try:
            latitude, longitude, resolved_name = self._resolve_coordinates(location, lat, lon, zip_code)
            params = {
                "lat": latitude,
                "lon": longitude,
                "appid": self.api_key,
                "units": unit_system,
            }
            res = self.session.get(self.CURRENT_WEATHER_URL, params=params, timeout=self.timeout)

            if res.status_code == 401:
                raise WeatherAPIError("Unauthorized: Invalid OpenWeather API key.", status_code=401)
            if res.status_code == 429:
                raise WeatherAPIError("Rate limited: OpenWeather API quota reached.", status_code=429)
            res.raise_for_status()

            raw = res.json()
            result = self._format_weather_dict(raw, resolved_name, unit_system)

            if as_json or compact:
                separators = (",", ":") if compact else None
                indent = None if compact else 2
                return json.dumps(result, separators=separators, indent=indent)
            return result

        except WeatherAPIError as e:
            err_dict = e.to_dict()
            return json.dumps(err_dict) if (as_json or compact) else err_dict
        except requests.exceptions.RequestException as e:
            err_dict = {"error": f"OpenWeather network error: {str(e)}"}
            return json.dumps(err_dict) if (as_json or compact) else err_dict
        except Exception as e:
            err_dict = {"error": f"Unexpected error: {str(e)}"}
            return json.dumps(err_dict) if (as_json or compact) else err_dict

    def get_forecast(
        self,
        location: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        zip_code: Optional[str] = None,
        days: int = 3,
        units: Optional[str] = None,
        compact: bool = False,
        as_json: bool = False,
    ) -> Union[Dict[str, Any], str]:
        """Fetch 5-day forecast condensed into daily summaries to save LLM tokens."""
        unit_system = units or self.units
        days = max(1, min(5, days))
        temp_unit = "°C" if unit_system == "metric" else "°F" if unit_system == "imperial" else "K"

        try:
            latitude, longitude, resolved_name = self._resolve_coordinates(location, lat, lon, zip_code)
            params = {
                "lat": latitude,
                "lon": longitude,
                "appid": self.api_key,
                "units": unit_system,
            }
            res = self.session.get(self.FORECAST_URL, params=params, timeout=self.timeout)

            if res.status_code == 401:
                raise WeatherAPIError("Unauthorized: Invalid OpenWeather API key.", status_code=401)
            if res.status_code == 429:
                raise WeatherAPIError("Rate limited: OpenWeather API quota reached.", status_code=429)
            res.raise_for_status()

            raw = res.json()
            forecast_list = raw.get("list", [])

            daily_buckets: Dict[str, List[Dict[str, Any]]] = {}
            for item in forecast_list:
                dt_txt = item.get("dt_txt", "")
                date_key = dt_txt.split(" ")[0] if " " in dt_txt else dt_txt
                if date_key not in daily_buckets:
                    daily_buckets[date_key] = []
                daily_buckets[date_key].append(item)

            daily_summaries: List[Dict[str, Any]] = []
            for date_key in list(daily_buckets.keys())[:days]:
                slots = daily_buckets[date_key]
                temps = [s["main"]["temp"] for s in slots if "main" in s and "temp" in s["main"]]
                conditions = [s["weather"][0]["description"].capitalize() for s in slots if s.get("weather")]
                pop_list = [s.get("pop", 0.0) for s in slots]

                dominant_condition = (
                    max(set(conditions), key=conditions.count) if conditions else "Unknown"
                )

                daily_summaries.append(
                    {
                        "date": date_key,
                        "temp_min": round(min(temps), 1) if temps else None,
                        "temp_max": round(max(temps), 1) if temps else None,
                        "temp_unit": temp_unit,
                        "condition": dominant_condition,
                        "max_rain_probability_pct": int(round(max(pop_list) * 100)) if pop_list else 0,
                    }
                )

            result: Dict[str, Any] = {
                "location": resolved_name,
                "lat": round(latitude, 4),
                "lon": round(longitude, 4),
                "days_forecasted": len(daily_summaries),
                "forecast": daily_summaries,
            }

            if as_json or compact:
                separators = (",", ":") if compact else None
                indent = None if compact else 2
                return json.dumps(result, separators=separators, indent=indent)
            return result

        except WeatherAPIError as e:
            err_dict = e.to_dict()
            return json.dumps(err_dict) if (as_json or compact) else err_dict
        except requests.exceptions.RequestException as e:
            err_dict = {"error": f"OpenWeather network error: {str(e)}"}
            return json.dumps(err_dict) if (as_json or compact) else err_dict
        except Exception as e:
            err_dict = {"error": f"Unexpected error: {str(e)}"}
            return json.dumps(err_dict) if (as_json or compact) else err_dict

    def find_nearby_weather(
        self,
        location: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        cnt: int = 5,
        units: Optional[str] = None,
        compact: bool = False,
        as_json: bool = False,
    ) -> Union[Dict[str, Any], str]:
        """Scan weather in surrounding cities / municipalities around a given center point."""
        unit_system = units or self.units
        cnt = max(1, min(20, cnt))

        try:
            latitude, longitude, resolved_name = self._resolve_coordinates(location, lat, lon)
            params = {
                "lat": latitude,
                "lon": longitude,
                "cnt": cnt,
                "appid": self.api_key,
                "units": unit_system,
            }
            res = self.session.get(self.FIND_URL, params=params, timeout=self.timeout)
            if res.status_code == 401:
                raise WeatherAPIError("Unauthorized: Invalid OpenWeather API key.", status_code=401)
            res.raise_for_status()

            raw = res.json()
            city_list = raw.get("list", [])
            places: List[Dict[str, Any]] = []

            for c in city_list:
                places.append(
                    {
                        "name": c.get("name"),
                        "condition": c["weather"][0]["description"].capitalize() if c.get("weather") else "Unknown",
                        "temp": c["main"]["temp"],
                        "feels_like": c["main"]["feels_like"],
                        "humidity_pct": c["main"]["humidity"],
                        "distance_hint": f"{round(c.get('coord', {}).get('lat', 0.0), 3)}, {round(c.get('coord', {}).get('lon', 0.0), 3)}",
                    }
                )

            result: Dict[str, Any] = {
                "center_location": resolved_name,
                "count": len(places),
                "nearby_cities": places,
            }

            if as_json or compact:
                separators = (",", ":") if compact else None
                indent = None if compact else 2
                return json.dumps(result, separators=separators, indent=indent)
            return result

        except WeatherAPIError as e:
            err_dict = e.to_dict()
            return json.dumps(err_dict) if (as_json or compact) else err_dict
        except Exception as e:
            err_dict = {"error": f"Failed nearby search: {str(e)}"}
            return json.dumps(err_dict) if (as_json or compact) else err_dict

    @classmethod
    def get_openai_tool_schema(cls) -> List[Dict[str, Any]]:
        """Returns JSON schema definitions for function-calling LLM agents."""
        return [
            {
                "type": "function",
                "function": {
                    "name": "get_current_weather",
                    "description": (
                        "Fetch real-time weather conditions for any geographic scope: "
                        "macro-regions (e.g. 'Southeast Asia'), countries (e.g. 'Philippines'), "
                        "cities (e.g. 'Manila, PH'), postal codes ('1000,PH'), or GPS coordinates."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "location": {
                                "type": "string",
                                "description": "City, country, or region (e.g. 'Manila, Philippines', 'Japan', 'Southeast Asia').",
                            },
                            "lat": {"type": "number", "description": "Optional direct latitude."},
                            "lon": {"type": "number", "description": "Optional direct longitude."},
                            "zip_code": {"type": "string", "description": "Postal code and country, e.g., '1000,PH'."},
                            "units": {
                                "type": "string",
                                "enum": ["metric", "imperial", "standard"],
                                "description": "Metric = Celsius/m-s, Imperial = Fahrenheit/mph.",
                            },
                        },
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "get_forecast",
                    "description": (
                        "Fetch condensed 1 to 5-day weather forecast with daily min/max temperatures, "
                        "dominant conditions, and rain probabilities."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "location": {
                                "type": "string",
                                "description": "City name and country code (e.g. 'Tagaytay, PH').",
                            },
                            "lat": {"type": "number", "description": "Direct latitude coordinate."},
                            "lon": {"type": "number", "description": "Direct longitude coordinate."},
                            "days": {
                                "type": "integer",
                                "minimum": 1,
                                "maximum": 5,
                                "description": "Number of forecast days (default: 3).",
                            },
                            "units": {
                                "type": "string",
                                "enum": ["metric", "imperial", "standard"],
                            },
                        },
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "find_nearby_weather",
                    "description": "Scan weather across multiple surrounding cities/municipalities around a focal location.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "location": {"type": "string", "description": "Focal city or address."},
                            "lat": {"type": "number", "description": "Focal latitude."},
                            "lon": {"type": "number", "description": "Focal longitude."},
                            "cnt": {"type": "integer", "description": "Number of surrounding cities (default 5, max 20)."},
                        },
                    },
                },
            },
        ]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="High-performance, multi-scale weather retrieval for AI agents."
    )
    parser.add_argument("--location", "-l", type=str, default=None, help="City, country, or region (e.g. 'Manila, Philippines').")
    parser.add_argument("--lat", type=float, default=None, help="Direct latitude coordinate.")
    parser.add_argument("--lon", type=float, default=None, help="Direct longitude coordinate.")
    parser.add_argument("--zip", type=str, default=None, help="Postal/ZIP code (e.g. '1000,PH').")
    parser.add_argument(
        "--forecast",
        action="store_true",
        help="Fetch multi-day daily forecast instead of current weather.",
    )
    parser.add_argument(
        "--nearby",
        action="store_true",
        help="Scan surrounding municipalities around the focal location.",
    )
    parser.add_argument("--count", type=int, default=5, help="Number of nearby cities to scan (default: 5).")
    parser.add_argument("--days", type=int, default=3, help="Number of forecast days (1-5, default: 3).")
    parser.add_argument(
        "--units",
        type=str,
        default="metric",
        choices=["metric", "imperial", "standard"],
        help="Measurement units.",
    )
    parser.add_argument(
        "--compact",
        action="store_true",
        help="Output minified JSON string without spaces for token efficiency.",
    )
    parser.add_argument(
        "--save",
        type=str,
        default=None,
        help="Optional filepath to save output JSON.",
    )

    args = parser.parse_args()

    if not args.location and not args.zip and (args.lat is None or args.lon is None):
        print(
            json.dumps({"error": "Must provide --location, --zip, or both --lat and --lon."}),
            file=sys.stderr,
        )
        sys.exit(1)

    tool = OpenWeatherTool(units=args.units)
    try:
        if args.forecast:
            output = tool.get_forecast(
                location=args.location,
                lat=args.lat,
                lon=args.lon,
                zip_code=args.zip,
                days=args.days,
                units=args.units,
                compact=args.compact,
                as_json=True,
            )
        elif args.nearby:
            output = tool.find_nearby_weather(
                location=args.location,
                lat=args.lat,
                lon=args.lon,
                cnt=args.count,
                units=args.units,
                compact=args.compact,
                as_json=True,
            )
        else:
            output = tool.get_current_weather(
                location=args.location,
                lat=args.lat,
                lon=args.lon,
                zip_code=args.zip,
                units=args.units,
                compact=args.compact,
                as_json=True,
            )

        if args.save:
            with open(args.save, "w", encoding="utf-8") as f:
                f.write(output if isinstance(output, str) else json.dumps(output))
            print(f"Weather data saved to {args.save}", file=sys.stderr)
        else:
            print(output)

    except WeatherAPIError as e:
        print(json.dumps(e.to_dict()), file=sys.stderr)
        sys.exit(2)
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
    finally:
        tool.close()


if __name__ == "__main__":
    main()
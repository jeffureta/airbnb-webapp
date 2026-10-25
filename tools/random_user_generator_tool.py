#!/usr/bin/env python3
"""
========================================================================================
RANDOM USER GENERATOR TOOL (random_user_generator_tool.py)
========================================================================================

ROLE & PURPOSE:
Equips Product Manager (PM) agents, Software Engineers, and UX/UI Designers with realistic,
demographically coherent synthetic user personas, mock customer profiles, host/guest data,
and test demographics using the Random User Generator API (https://randomuser.me/).

CORE AGENT & PM USE CASES:
1. Product Persona Creation & Target Customer Profiles:
   - Generate realistic user personas with demographic attributes (age, location, gender, nationality).
   - Populate empathy maps, customer journey touchpoints, and PRD persona archetypes.
2. Market Segmentation & Global Localization Testing:
   - Scope user cohorts by nationality (e.g. US, GB, CA, AU, FR, DE, ES, etc.).
   - Model domestic vs. inbound international guest demographics for staycation apps.
3. Realistic User Testing & UI Mock Data Seeding:
   - Provide realistic avatars, full names, locations, contact info, and credentials for UX wireframes.
   - Seed sample booking inquiries, host profile bios, and reviews with realistic profiles.
4. Deterministic Reproducibility (Seeds):
   - Use `--seed <seed_name>` so agents and test suites always reproduce the exact same personas across runs.
5. Token-Efficient Context Preserving Output:
   - Flattened/curated summary representation to minimize LLM token usage in context windows.
   - `--compact` flag outputs single-line minified JSON.
   - `--inc` / `--exc` flags to selectively include/exclude fields (e.g. skip login credentials).

FUNCTIONS EXPOSED:
1. `fetch_random_users(...)`:
   - Fetches random users with configurable filtering, nationality, gender, seeds, and field inclusion.
2. `generate_pm_personas(...)`:
   - Curates and transforms raw user records into PM-friendly persona structures with summary profiles.
3. `get_openai_tool_schema()`:
   - Returns OpenAI / Gemini tool function-calling schema definitions.

CLI EXAMPLES:
   python tools/random_user_generator_tool.py --results 3 --nat us,ca,gb
   python tools/random_user_generator_tool.py --results 5 --gender female --seed "staycation_persona"
   python tools/random_user_generator_tool.py --results 2 --format-mode persona --compact
   python tools/random_user_generator_tool.py --results 1 --inc "name,email,location,picture" --compact
========================================================================================
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from typing import Any, Dict, List, Optional, Union
import requests

BASE_API_URL = "https://randomuser.me/api/1.4/"

# Supported nationalities in RandomUser.me v1.4
SUPPORTED_NATIONALITIES = [
    "AU", "BR", "CA", "CH", "DE", "DK", "ES", "FI", "FR",
    "GB", "IE", "IN", "IR", "MX", "NL", "NO", "NZ", "RS", "TR", "UA", "US"
]


class RandomUserAPIError(Exception):
    """Custom diagnostic exception for Random User API errors."""

    def __init__(self, message: str, status_code: Optional[int] = None, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "error": True,
            "message": self.message,
            "status_code": self.status_code,
            "details": self.details,
        }


def fetch_random_users(
    results: int = 1,
    gender: Optional[str] = None,
    nat: Optional[Union[str, List[str]]] = None,
    seed: Optional[str] = None,
    page: Optional[int] = None,
    inc: Optional[Union[str, List[str]]] = None,
    exc: Optional[Union[str, List[str]]] = None,
    noinfo: bool = False,
    timeout: float = 10.0,
) -> Dict[str, Any]:
    """
    Fetch synthetic user data directly from the RandomUser.me API.

    Args:
        results: Number of user profiles to generate (1 to 5000).
        gender: Optional gender filter ('male' or 'female').
        nat: Country code(s) (e.g., 'us' or ['us', 'gb', 'ca']).
        seed: String seed for deterministic reproducibility.
        page: Page number for pagination when using seeds.
        inc: Comma-separated or list of fields to include (e.g., 'name,email,location').
        exc: Comma-separated or list of fields to exclude (e.g., 'login').
        noinfo: If True, omits metadata info block to save bandwidth/tokens.
        timeout: Request timeout in seconds.

    Returns:
        Dict containing 'results' list and 'info' metadata dict.
    """
    params: Dict[str, Any] = {"results": max(1, min(results, 5000))}

    if gender and gender.lower() in ["male", "female"]:
        params["gender"] = gender.lower()

    if nat:
        if isinstance(nat, list):
            params["nat"] = ",".join(n.strip().lower() for n in nat if n.strip())
        else:
            params["nat"] = nat.strip().lower()

    if seed:
        params["seed"] = seed.strip()

    if page is not None and page > 0:
        params["page"] = page

    if inc:
        params["inc"] = ",".join(inc) if isinstance(inc, list) else inc

    if exc:
        params["exc"] = ",".join(exc) if isinstance(exc, list) else exc

    if noinfo:
        params["noinfo"] = "true"

    headers = {
        "User-Agent": "Airbnb-Agentic-App/1.0 (ProductManagerPersonaTool)",
        "Accept": "application/json",
    }

    try:
        response = requests.get(BASE_API_URL, params=params, headers=headers, timeout=timeout)
        response.raise_for_status()
        data = response.json()
        if "error" in data:
            raise RandomUserAPIError(data["error"], status_code=response.status_code)
        return data
    except requests.exceptions.RequestException as e:
        status = getattr(e.response, "status_code", None)
        raise RandomUserAPIError(f"HTTP request to RandomUser API failed: {str(e)}", status_code=status)


def generate_pm_personas(
    results: int = 1,
    gender: Optional[str] = None,
    nat: Optional[Union[str, List[str]]] = None,
    seed: Optional[str] = None,
    role_type: str = "guest",  # 'guest', 'host', or 'general'
) -> List[Dict[str, Any]]:
    """
    Transforms raw random user data into structured, token-efficient Product Management personas
    tailored for PRDs, user stories, customer journey maps, and staycation application testing.

    Args:
        results: Number of personas to generate.
        gender: Optional gender filter ('male' or 'female').
        nat: Optional nationality filter.
        seed: Deterministic seed string.
        role_type: Archetype focus ('guest', 'host', 'general').

    Returns:
        List of PM Persona dictionaries.
    """
    raw_data = fetch_random_users(
        results=results,
        gender=gender,
        nat=nat,
        seed=seed,
        exc="login",  # Exclude unnecessary cryptographic hashes to save tokens
    )

    personas = []
    for user in raw_data.get("results", []):
        name_info = user.get("name", {})
        full_name = f"{name_info.get('title', '')} {name_info.get('first', '')} {name_info.get('last', '')}".strip()
        loc = user.get("location", {})
        street = loc.get("street", {})
        street_str = f"{street.get('number', '')} {street.get('name', '')}".strip()

        city = loc.get("city", "")
        state = loc.get("state", "")
        country = loc.get("country", "")
        location_str = ", ".join(part for part in [city, state, country] if part)

        dob = user.get("dob", {})
        age = dob.get("age", 30)

        # Build persona archetype
        persona = {
            "name": full_name,
            "gender": user.get("gender"),
            "age": age,
            "nationality": user.get("nat"),
            "location": {
                "city": city,
                "state": state,
                "country": country,
                "address": street_str,
                "postcode": loc.get("postcode"),
                "coordinates": loc.get("coordinates"),
                "timezone": loc.get("timezone", {}).get("description"),
            },
            "contact": {
                "email": user.get("email"),
                "phone": user.get("phone"),
                "cell": user.get("cell"),
            },
            "avatar": user.get("picture", {}).get("large"),
            "role_archetype": role_type,
            "summary_tagline": f"{age}yo {user.get('gender', 'person')} based in {city or country}",
        }

        # Add PM contextual archetypes for travel / hospitality / staycation applications
        if role_type.lower() == "host":
            persona["pm_context"] = {
                "user_segment": "Property Host / Provider",
                "sample_goals": ["Maximize occupancy", "Streamline check-ins", "Secure timely payouts"],
                "sample_pain_points": ["Last-minute cancellations", "Damage deposit friction", "Guest communication latency"],
            }
        elif role_type.lower() == "guest":
            persona["pm_context"] = {
                "user_segment": "Staycation Guest / Traveler",
                "sample_goals": ["Discover weekend getaways", "Transparent pricing", "Seamless mobile check-in"],
                "sample_pain_points": ["Misleading photos", "Hidden cleaning fees", "Strict cancellation penalties"],
            }
        else:
            persona["pm_context"] = {
                "user_segment": "Standard Platform User",
                "sample_goals": ["Quick booking", "Clear communication"],
                "sample_pain_points": ["Cluttered interface", "Slow load times"],
            }

        personas.append(persona)

    return personas


def get_openai_tool_schema() -> List[Dict[str, Any]]:
    """
    Returns OpenAI / Gemini function-calling schemas for integration into AI agent loops.
    """
    return [
        {
            "name": "generate_pm_personas",
            "description": (
                "Generates realistic synthetic user personas tailored for Product Managers (PRDs, customer journey maps, "
                "staycation/travel user stories, and test demographic cohorts) using the Random User Generator API."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "results": {
                        "type": "integer",
                        "description": "Number of personas to generate (1 to 50). Default is 1.",
                        "default": 1,
                    },
                    "gender": {
                        "type": "string",
                        "enum": ["male", "female"],
                        "description": "Optional gender filter.",
                    },
                    "nat": {
                        "type": "string",
                        "description": "Comma-separated country code(s) (e.g. 'us,ca,gb,au,es').",
                    },
                    "seed": {
                        "type": "string",
                        "description": "Optional seed string for deterministic persona generation across runs.",
                    },
                    "role_type": {
                        "type": "string",
                        "enum": ["guest", "host", "general"],
                        "description": "Archetype role focus for travel/staycation products. Default is 'guest'.",
                        "default": "guest",
                    },
                },
                "required": [],
            },
        },
        {
            "name": "fetch_random_users",
            "description": "Fetches raw synthetic user records from randomuser.me with full API filtering options.",
            "parameters": {
                "type": "object",
                "properties": {
                    "results": {"type": "integer", "description": "Number of users (1-5000).", "default": 1},
                    "gender": {"type": "string", "enum": ["male", "female"]},
                    "nat": {"type": "string", "description": "Comma-separated country codes."},
                    "seed": {"type": "string", "description": "Seed string for reproducibility."},
                    "inc": {"type": "string", "description": "Comma-separated fields to include (e.g. 'name,email,picture')."},
                    "exc": {"type": "string", "description": "Comma-separated fields to exclude (e.g. 'login')."},
                },
                "required": [],
            },
        },
    ]


def main():
    parser = argparse.ArgumentParser(
        description="Random User Generator Tool for PM Personas, User Mock Data, and Demographic Cohorts."
    )
    parser.add_argument("--results", "-n", type=int, default=1, help="Number of profiles to generate (default: 1)")
    parser.add_argument("--gender", "-g", choices=["male", "female"], help="Gender filter")
    parser.add_argument("--nat", type=str, help="Comma-separated nationality codes (e.g. us,ca,gb,au,es)")
    parser.add_argument("--seed", "-s", type=str, help="Seed string for deterministic reproducibility")
    parser.add_argument("--page", "-p", type=int, help="Page number for pagination")
    parser.add_argument("--inc", type=str, help="Comma-separated fields to include (e.g. name,email,picture)")
    parser.add_argument("--exc", type=str, help="Comma-separated fields to exclude (e.g. login)")
    parser.add_argument(
        "--format-mode",
        choices=["persona", "raw"],
        default="persona",
        help="Format output: 'persona' (curated for PM PRDs/personas) or 'raw' (direct API response). Default: persona.",
    )
    parser.add_argument(
        "--role-type",
        choices=["guest", "host", "general"],
        default="guest",
        help="Target archetype role when using --format-mode persona (default: guest)",
    )
    parser.add_argument("--compact", action="store_true", help="Emit minified JSON to preserve LLM token context")
    parser.add_argument("--save", type=str, help="Optional file path to save output JSON")
    parser.add_argument("--schema", action="store_true", help="Output OpenAI/Gemini tool calling schema and exit")

    args = parser.parse_args()

    if args.schema:
        print(json.dumps(get_openai_tool_schema(), indent=2))
        sys.exit(0)

    try:
        if args.format_mode == "persona":
            output_data = generate_pm_personas(
                results=args.results,
                gender=args.gender,
                nat=args.nat,
                seed=args.seed,
                role_type=args.role_type,
            )
        else:
            output_data = fetch_random_users(
                results=args.results,
                gender=args.gender,
                nat=args.nat,
                seed=args.seed,
                page=args.page,
                inc=args.inc,
                exc=args.exc,
            )

        json_str = json.dumps(output_data, separators=(",", ":") if args.compact else None, indent=None if args.compact else 2)

        if args.save:
            with open(args.save, "w", encoding="utf-8") as f:
                f.write(json_str)
            print(f"Successfully saved {args.results} records to {args.save}", file=sys.stderr)

        print(json_str)

    except RandomUserAPIError as e:
        err_dict = e.to_dict()
        print(json.dumps(err_dict, indent=2), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": True, "message": str(e)}, indent=2), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
========================================================================================
JSONPLACEHOLDER TOOL (json_placeholder_tool.py)
========================================================================================

ROLE & PURPOSE:
Equips Product Manager (PM) agents, Software Engineers, and UX/UI Designers with mock REST
API resources, synthetic user content, mock feeds, reviews, and test data using the 
JSONPlaceholder API (https://jsonplaceholder.typicode.com/).

CORE AGENT & PM USE CASES:
1. Product Feature Prototyping & Mock Data Modeling:
   - Simulate core content feeds (e.g. host listings, descriptions, updates) using `/posts`.
   - Model user reviews, host responses, and customer feedback threads using `/comments`.
   - Model user profiles, contact directory, and partner organizations using `/users`.
   - Simulate onboarding checklists, host task lists, and verification items using `/todos`.
   - Prototype gallery/listing photo metadata and visual albums using `/albums` and `/photos`.
2. Nested Relational Integrity & Workflow Testing:
   - Validate 1-to-many relationships (e.g., Post -> Comments, User -> Posts, User -> Albums, User -> Todos).
   - Test UI states for nested comments, multi-item task checklists, and author attribution.
3. Realistic API Mutation Simulation (Safe Sandboxing):
   - Simulate CRUD operations (POST, PUT, PATCH, DELETE) to draft technical PRD acceptance
     criteria and test state transitions safely without backend state corruption.
4. Token-Efficient Context Preserving Output:
   - `--compact` outputs single-line minified JSON to preserve context window limits.
   - Built-in pagination (`--limit`, `--page`) and selective field slicing to prevent token blowup.
5. PM Archetype Synthesis (`generate_pm_mock_feed`):
   - Automatically packages posts, author details, and comments into ready-to-use staycation
     review cards, listing descriptions, or product backlog feed representations.

RESOURCES AVAILABLE:
- posts: 100 posts (fields: id, userId, title, body)
- comments: 500 comments (fields: id, postId, name, email, body)
- albums: 100 albums (fields: id, userId, title)
- photos: 5000 photos (fields: id, albumId, title, url, thumbnailUrl)
- todos: 200 todos (fields: id, userId, title, completed)
- users: 10 users (fields: id, name, username, email, address, phone, website, company)

NESTED ROUTES SUPPORTED:
- /posts/<id>/comments
- /albums/<id>/photos
- /users/<id>/albums
- /users/<id>/todos
- /users/<id>/posts

CLI EXAMPLES:
   python tools/json_placeholder_tool.py --resource posts --limit 5 --compact
   python tools/json_placeholder_tool.py --resource users --item-id 1
   python tools/json_placeholder_tool.py --resource posts --item-id 1 --nested comments --compact
   python tools/json_placeholder_tool.py --resource posts --filter "userId=1" --limit 3
   python tools/json_placeholder_tool.py --format-mode pm-feed --limit 3 --include-comments
   python tools/json_placeholder_tool.py --resource posts --action create --data '{"title":"New staycation","body":"Great mountain view","userId":1}'
========================================================================================
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import Any, Dict, List, Optional, Union
import requests

BASE_API_URL = "https://jsonplaceholder.typicode.com"

VALID_RESOURCES = ["posts", "comments", "albums", "photos", "todos", "users"]
VALID_NESTED: Dict[str, List[str]] = {
    "posts": ["comments"],
    "albums": ["photos"],
    "users": ["albums", "todos", "posts"],
}


class JSONPlaceholderAPIError(Exception):
    """Custom diagnostic exception for JSONPlaceholder API errors."""

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


def filter_fields(
    data: Union[Dict[str, Any], List[Dict[str, Any]]],
    fields: Optional[List[str]],
) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
    """
    Filter dict or list of dicts to only contain the specified fields.
    Preserves token efficiency when LLMs/agents request specific attributes.
    """
    if not fields:
        return data

    fields_set = {f.strip() for f in fields if f.strip()}
    if not fields_set:
        return data

    if isinstance(data, list):
        return [
            {k: v for k, v in item.items() if k in fields_set}
            if isinstance(item, dict) else item
            for item in data
        ]
    elif isinstance(data, dict):
        return {k: v for k, v in data.items() if k in fields_set}
    return data


def get_resource(
    resource: str,
    item_id: Optional[Union[int, str]] = None,
    nested: Optional[str] = None,
    filters: Optional[Dict[str, Any]] = None,
    limit: Optional[int] = None,
    page: Optional[int] = None,
    fields: Optional[List[str]] = None,
    timeout: float = 10.0,
) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
    """
    Fetch resources or nested relations from JSONPlaceholder.

    Args:
        resource: One of 'posts', 'comments', 'albums', 'photos', 'todos', 'users'.
        item_id: Optional specific item ID (e.g. 1).
        nested: Optional nested sub-resource (e.g. 'comments' under 'posts', or 'photos' under 'albums').
        filters: Optional query parameters for filtering (e.g. {'userId': 1}).
        limit: Optional maximum number of records to return (_limit query param).
        page: Optional page number (_page query param).
        fields: Optional list of field names to slice from each record for token conservation.
        timeout: HTTP request timeout in seconds.

    Returns:
        Dict or List of Dicts representing the returned API payload.
    """
    resource_clean = resource.strip().lower()
    if resource_clean not in VALID_RESOURCES:
        raise JSONPlaceholderAPIError(
            f"Invalid resource '{resource}'. Must be one of: {', '.join(VALID_RESOURCES)}"
        )

    # Build target URL
    if item_id is not None:
        url = f"{BASE_API_URL}/{resource_clean}/{item_id}"
        if nested:
            nested_clean = nested.strip().lower()
            allowed_nested = VALID_NESTED.get(resource_clean, [])
            if nested_clean not in allowed_nested:
                raise JSONPlaceholderAPIError(
                    f"Invalid nested resource '{nested_clean}' for '{resource_clean}'. Allowed: {', '.join(allowed_nested)}"
                )
            url = f"{url}/{nested_clean}"
    else:
        url = f"{BASE_API_URL}/{resource_clean}"

    params: Dict[str, Any] = {}
    if filters:
        params.update(filters)
    if limit is not None and limit > 0:
        params["_limit"] = limit
    if page is not None and page > 0:
        params["_page"] = page

    headers = {
        "User-Agent": "Airbnb-Agentic-App/1.0 (JSONPlaceholderPMTool)",
        "Accept": "application/json",
    }

    try:
        response = requests.get(url, params=params, headers=headers, timeout=timeout)
        response.raise_for_status()
        raw_json = response.json()
        return filter_fields(raw_json, fields)
    except requests.exceptions.RequestException as e:
        status = getattr(e.response, "status_code", None)
        raise JSONPlaceholderAPIError(f"HTTP request to JSONPlaceholder failed: {str(e)}", status_code=status)


def mutate_resource(
    resource: str,
    action: str,  # 'create', 'update', 'patch', 'delete'
    item_id: Optional[Union[int, str]] = None,
    payload: Optional[Dict[str, Any]] = None,
    timeout: float = 10.0,
) -> Dict[str, Any]:
    """
    Perform simulated mutation operations (POST, PUT, PATCH, DELETE) against JSONPlaceholder.

    Args:
        resource: Target resource name (e.g. 'posts').
        action: One of 'create', 'update', 'patch', 'delete'.
        item_id: Required for update, patch, and delete.
        payload: Data dictionary for create, update, or patch.
        timeout: HTTP request timeout in seconds.

    Returns:
        Dict returned by JSONPlaceholder confirming the simulated operation.
    """
    resource_clean = resource.strip().lower()
    action_clean = action.strip().lower()

    if resource_clean not in VALID_RESOURCES:
        raise JSONPlaceholderAPIError(
            f"Invalid resource '{resource}'. Must be one of: {', '.join(VALID_RESOURCES)}"
        )

    headers = {
        "User-Agent": "Airbnb-Agentic-App/1.0 (JSONPlaceholderPMTool)",
        "Content-Type": "application/json; charset=UTF-8",
        "Accept": "application/json",
    }

    try:
        if action_clean == "create":
            url = f"{BASE_API_URL}/{resource_clean}"
            response = requests.post(url, json=payload or {}, headers=headers, timeout=timeout)
        elif action_clean in ["update", "patch", "delete"]:
            if item_id is None:
                raise JSONPlaceholderAPIError(f"Action '{action_clean}' requires an item_id.")
            url = f"{BASE_API_URL}/{resource_clean}/{item_id}"
            if action_clean == "update":
                response = requests.put(url, json=payload or {}, headers=headers, timeout=timeout)
            elif action_clean == "patch":
                response = requests.patch(url, json=payload or {}, headers=headers, timeout=timeout)
            else:  # delete
                response = requests.delete(url, headers=headers, timeout=timeout)
        else:
            raise JSONPlaceholderAPIError(
                f"Invalid action '{action}'. Must be 'create', 'update', 'patch', or 'delete'."
            )

        response.raise_for_status()
        data = response.json()
        return {
            "status": "success",
            "simulated": True,
            "action": action_clean,
            "resource": resource_clean,
            "response": data,
        }
    except requests.exceptions.RequestException as e:
        status = getattr(e.response, "status_code", None)
        raise JSONPlaceholderAPIError(f"HTTP mutation on JSONPlaceholder failed: {str(e)}", status_code=status)


def generate_pm_mock_feed(
    limit: int = 5,
    user_id: Optional[int] = None,
    include_comments: bool = False,
    comment_limit: int = 2,
    timeout: float = 10.0,
) -> List[Dict[str, Any]]:
    """
    High-level PM synthesis utility that aggregates Posts with User metadata and nested Comments.
    Translates generic JSONPlaceholder data into structured mock listings/reviews feed for PRD
    specifications, prototype seeding, and UX mock reviews.

    Args:
        limit: Number of feed items to construct (1 to 20).
        user_id: Optional user/author filter.
        include_comments: Whether to fetch and attach nested comments for each post.
        comment_limit: Max comments per post if include_comments is True.
        timeout: HTTP request timeout in seconds.

    Returns:
        List of enriched feed items ready for PM story documentation or wireframe mocking.
    """
    filters = {"userId": user_id} if user_id else None
    posts = get_resource("posts", filters=filters, limit=min(limit, 20), timeout=timeout)
    if isinstance(posts, dict):
        posts = [posts]

    # Preload users to map author details without redundant fetches
    raw_users = get_resource("users", timeout=timeout)
    users_by_id = {u["id"]: u for u in raw_users} if isinstance(raw_users, list) else {}

    feed_items = []
    for post in posts:
        author = users_by_id.get(post.get("userId"), {})
        post_id = post.get("id")

        feed_item: Dict[str, Any] = {
            "item_id": post_id,
            "headline": post.get("title"),
            "content": post.get("body"),
            "author": {
                "user_id": author.get("id"),
                "name": author.get("name", f"User {post.get('userId')}"),
                "username": author.get("username"),
                "email": author.get("email"),
                "company": author.get("company", {}).get("name"),
                "city": author.get("address", {}).get("city"),
            },
        }

        if include_comments and post_id is not None:
            comments = get_resource(
                "posts",
                item_id=post_id,
                nested="comments",
                limit=comment_limit,
                timeout=timeout,
            )
            if isinstance(comments, list):
                feed_item["comments_count_sample"] = len(comments)
                feed_item["sample_comments"] = [
                    {
                        "comment_id": c.get("id"),
                        "commenter_name": c.get("name"),
                        "commenter_email": c.get("email"),
                        "comment_body": c.get("body"),
                    }
                    for c in comments[:comment_limit]
                ]

        feed_items.append(feed_item)

    return feed_items


def get_openai_tool_schema() -> List[Dict[str, Any]]:
    """
    Returns OpenAI / Gemini function-calling schemas for AI agent loop integration.
    """
    return [
        {
            "name": "get_resource",
            "description": (
                "Fetches mock REST data from JSONPlaceholder across 6 core resources (posts, comments, albums, "
                "photos, todos, users) with optional nested relationship queries, IDs, and filters."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "resource": {
                        "type": "string",
                        "enum": ["posts", "comments", "albums", "photos", "todos", "users"],
                        "description": "The target JSONPlaceholder resource name.",
                    },
                    "item_id": {
                        "type": "integer",
                        "description": "Optional specific item ID (e.g. 1 to retrieve a single record).",
                    },
                    "nested": {
                        "type": "string",
                        "enum": ["comments", "photos", "albums", "todos", "posts"],
                        "description": "Optional 1-level nested relation (e.g. 'comments' for posts, 'photos' for albums).",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max number of items to return (_limit query param). Conserves tokens.",
                    },
                    "page": {
                        "type": "integer",
                        "description": "Pagination page number (_page query param).",
                    },
                    "fields": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Optional list of field names to extract (e.g. ['id', 'title']), saving LLM context tokens.",
                    },
                },
                "required": ["resource"],
            },
        },
        {
            "name": "generate_pm_mock_feed",
            "description": (
                "Generates a synthesized mock feed combining posts, author/user information, and nested comments. "
                "Ideal for PM PRD mock data, user review simulation, and wireframe prototypes."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Number of feed items (1-20). Default is 5.",
                        "default": 5,
                    },
                    "user_id": {
                        "type": "integer",
                        "description": "Optional user/author ID filter.",
                    },
                    "include_comments": {
                        "type": "boolean",
                        "description": "Whether to fetch and attach sample comments per item. Default is true.",
                        "default": True,
                    },
                    "comment_limit": {
                        "type": "integer",
                        "description": "Max sample comments per feed item (default: 2).",
                        "default": 2,
                    },
                },
                "required": [],
            },
        },
        {
            "name": "mutate_resource",
            "description": (
                "Simulates creating, updating, patching, or deleting resources on JSONPlaceholder "
                "to validate API workflows and state transitions in PRDs."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "resource": {
                        "type": "string",
                        "enum": ["posts", "comments", "albums", "photos", "todos", "users"],
                        "description": "Resource to mutate.",
                    },
                    "action": {
                        "type": "string",
                        "enum": ["create", "update", "patch", "delete"],
                        "description": "HTTP mutation action.",
                    },
                    "item_id": {
                        "type": "integer",
                        "description": "Item ID required for update, patch, and delete.",
                    },
                    "payload": {
                        "type": "object",
                        "description": "JSON dictionary payload for create, update, or patch.",
                    },
                },
                "required": ["resource", "action"],
            },
        },
    ]


def main():
    parser = argparse.ArgumentParser(
        description="JSONPlaceholder Tool for Mock REST APIs, Synthetic Feeds, and UX/PM Prototypes."
    )
    parser.add_argument(
        "--resource", "-r",
        choices=VALID_RESOURCES,
        help="Target resource (posts, comments, albums, photos, todos, users)",
    )
    parser.add_argument("--item-id", "-i", type=int, help="Specific resource ID")
    parser.add_argument(
        "--nested",
        choices=["comments", "photos", "albums", "todos", "posts"],
        help="Nested relation (e.g., 'comments' under posts, 'photos' under albums)",
    )
    parser.add_argument("--filter", "-f", type=str, help="Query filter in 'key=val,key2=val2' format (e.g. 'userId=1')")
    parser.add_argument("--limit", "-l", type=int, help="Max items to return (_limit query param)")
    parser.add_argument("--page", "-p", type=int, help="Page number (_page query param)")
    parser.add_argument(
        "--fields",
        type=str,
        help="Comma-separated field list to slice from each record (e.g. 'id,title,userId') for token conservation",
    )

    parser.add_argument(
        "--action", "-a",
        choices=["get", "create", "update", "patch", "delete"],
        default="get",
        help="Action to perform (default: get)",
    )
    parser.add_argument("--data", "-d", type=str, help="JSON string data payload for create/update/patch")

    parser.add_argument(
        "--format-mode",
        choices=["standard", "pm-feed"],
        default="standard",
        help="Output mode: 'standard' (raw resource data) or 'pm-feed' (synthesized posts + author + comments).",
    )
    parser.add_argument("--include-comments", action="store_true", help="Include nested comments in pm-feed mode")
    parser.add_argument("--comment-limit", type=int, default=2, help="Sample comments limit in pm-feed mode")

    parser.add_argument("--compact", action="store_true", help="Emit minified JSON to preserve LLM token context")
    parser.add_argument("--save", type=str, help="Optional file path to save output JSON")
    parser.add_argument("--schema", action="store_true", help="Output OpenAI/Gemini tool calling schema and exit")

    args = parser.parse_args()

    if args.schema:
        print(json.dumps(get_openai_tool_schema(), indent=2))
        sys.exit(0)

    try:
        # PM-Feed synthesis mode
        if args.format_mode == "pm-feed":
            limit = args.limit or 5
            feed = generate_pm_mock_feed(
                limit=limit,
                user_id=args.item_id,
                include_comments=args.include_comments,
                comment_limit=args.comment_limit,
            )
            output_data = feed
        elif args.action in ["create", "update", "patch", "delete"]:
            if not args.resource:
                parser.error("--resource is required for mutation actions.")

            payload: Optional[Dict[str, Any]] = None
            if args.data:
                try:
                    parsed_payload = json.loads(args.data)
                    if not isinstance(parsed_payload, dict):
                        raise JSONPlaceholderAPIError(
                            f"Payload data must be a JSON object (dictionary), but got {type(parsed_payload).__name__}."
                        )
                    payload = parsed_payload
                except json.JSONDecodeError as decode_err:
                    raise JSONPlaceholderAPIError(
                        f"Malformed JSON string provided in --data: {str(decode_err)}"
                    )

            output_data = mutate_resource(
                resource=args.resource,
                action=args.action,
                item_id=args.item_id,
                payload=payload,
            )
        else:
            if not args.resource:
                parser.error("--resource is required when not using --format-mode pm-feed.")
            filters = {}
            if args.filter:
                for part in args.filter.split(","):
                    if "=" in part:
                        k, v = part.split("=", 1)
                        filters[k.strip()] = v.strip()

            fields_list = [f.strip() for f in args.fields.split(",") if f.strip()] if args.fields else None

            output_data = get_resource(
                resource=args.resource,
                item_id=args.item_id,
                nested=args.nested,
                filters=filters,
                limit=args.limit,
                page=args.page,
                fields=fields_list,
            )

        json_str = json.dumps(
            output_data,
            separators=(",", ":") if args.compact else None,
            indent=None if args.compact else 2,
        )

        if args.save:
            with open(args.save, "w", encoding="utf-8") as f:
                f.write(json_str)
            print(f"Successfully saved records to {args.save}", file=sys.stderr)

        print(json_str)

    except JSONPlaceholderAPIError as e:
        err_dict = e.to_dict()
        print(json.dumps(err_dict, indent=2), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": True, "message": str(e)}, indent=2), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

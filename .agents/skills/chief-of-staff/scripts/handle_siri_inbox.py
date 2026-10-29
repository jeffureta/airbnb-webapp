#!/usr/bin/env python3
"""
T-Cos Siri Inbox Handler
Logs inbound requests, thoughts, and tasks routed via Siri or Apple Shortcuts.
"""

import sys
import json
import os
from datetime import datetime

INBOX_FILE = os.path.expanduser("~/repos/airbnb-webapp/.agents/skills/chief-of-staff/inbox/requests.jsonl")

def log_request(text: str, source: str = "Siri"):
    entry = {
        "timestamp": datetime.now().isoformat(),
        "source": source,
        "content": text.strip()
    }
    os.makedirs(os.path.dirname(INBOX_FILE), exist_ok=True)
    with open(INBOX_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    print(f"Logged to T-Cos Inbox: '{text.strip()}'")

def list_requests():
    if not os.path.exists(INBOX_FILE):
        print("Inbox is empty.")
        return
    with open(INBOX_FILE, "r", encoding="utf-8") as f:
        lines = f.readlines()
    print(f"Total requests in inbox: {len(lines)}")
    for line in lines[-10:]:
        data = json.loads(line)
        print(f"[{data.get('timestamp')}] ({data.get('source')}): {data.get('content')}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "--list":
            list_requests()
        else:
            log_request(" ".join(sys.argv[1:]))
    else:
        # Check stdin
        stdin_content = sys.stdin.read().strip()
        if stdin_content:
            log_request(stdin_content)
        else:
            print("Usage: python3 handle_siri_inbox.py <request text> | --list")


#!/usr/bin/env python3
"""
Calendar CLI integration tool for Agents.
Retrieves agenda events using gcalcli or Apple Calendar.
"""

import sys
import subprocess
import json

def get_google_agenda(days=7):
    try:
        res = subprocess.run(
            ["gcalcli", "agenda", "--tsv"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if res.returncode == 0:
            lines = [l.strip() for l in res.stdout.strip().split("\n") if l.strip()]
            if len(lines) <= 1:
                return "No upcoming events found on your Google Calendar."
            events = []
            header = lines[0].split("\t")
            for line in lines[1:]:
                parts = line.split("\t")
                if len(parts) >= 5:
                    events.append({
                        "start_date": parts[0],
                        "start_time": parts[1] if parts[1] else "All-day",
                        "end_date": parts[2],
                        "end_time": parts[3] if parts[3] else "All-day",
                        "title": parts[4]
                    })
            return events
        return f"Error executing gcalcli: {res.stderr}"
    except Exception as e:
        return f"Exception querying calendar: {str(e)}"

if __name__ == "__main__":
    events = get_google_agenda()
    if isinstance(events, list):
        print(f"📅 Found {len(events)} upcoming events:\n")
        for ev in events:
            time_str = f"at {ev['start_time']}" if ev['start_time'] != "All-day" else "(All-day)"
            print(f"- {ev['start_date']} {time_str}: {ev['title']}")
    else:
        print(events)

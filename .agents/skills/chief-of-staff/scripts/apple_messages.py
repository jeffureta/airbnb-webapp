#!/usr/bin/env python3
"""
apple-messages: A CLI tool to read, search, and send Apple Messages (iMessage & SMS) on macOS.
"""

import sys
import os
import sqlite3
import argparse
import subprocess

CHAT_DB = os.path.expanduser("~/Library/Messages/chat.db")

def check_db_access():
    if not os.path.exists(CHAT_DB):
        sys.stderr.write(f"Error: {CHAT_DB} does not exist.\n")
        sys.exit(1)
    if not os.access(CHAT_DB, os.R_OK):
        sys.stderr.write(f"Error: Cannot read {CHAT_DB}. Please grant Full Disk Access to your Terminal/IDE in System Settings.\n")
        sys.exit(1)

def get_connection():
    check_db_access()
    return sqlite3.connect(f"file:{CHAT_DB}?mode=ro", uri=True)

def cmd_recent(args):
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime') as msg_time,
        coalesce(h.id, 'Self') as sender,
        m.is_from_me,
        coalesce(m.text, '[Attachment/Media]') as content
    FROM message m
    LEFT JOIN handle h ON m.handle_id = h.rowid
    WHERE m.text IS NOT NULL AND trim(m.text) != ''
    ORDER BY m.date DESC 
    LIMIT ?
    """
    cursor.execute(query, (args.limit,))
    rows = cursor.fetchall()
    
    print(f"\n--- Recent Messages (Last {len(rows)}) ---")
    for msg_time, sender, is_from_me, content in reversed(rows):
        direction = "OUT ->" if is_from_me else "IN  <-"
        print(f"[{msg_time}] {direction} {sender}: {content.strip()}")
    print()

def cmd_unread(args):
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime') as msg_time,
        coalesce(h.id, 'Unknown') as sender,
        coalesce(m.text, '[Attachment/Media]') as content
    FROM message m
    LEFT JOIN handle h ON m.handle_id = h.rowid
    WHERE m.is_from_me = 0 
      AND m.is_read = 0
      AND m.text IS NOT NULL AND trim(m.text) != ''
    ORDER BY m.date DESC 
    LIMIT ?
    """
    cursor.execute(query, (args.limit,))
    rows = cursor.fetchall()
    
    if not rows:
        print("\nNo unread messages found.")
        return
        
    print(f"\n--- Unread Inbound Messages ({len(rows)}) ---")
    for msg_time, sender, content in rows:
        print(f"[{msg_time}] FROM: {sender}\n  {content.strip()}\n")

def cmd_search(args):
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime') as msg_time,
        coalesce(h.id, 'Self') as sender,
        m.is_from_me,
        m.text
    FROM message m
    LEFT JOIN handle h ON m.handle_id = h.rowid
    WHERE m.text LIKE ?
    ORDER BY m.date DESC 
    LIMIT ?
    """
    cursor.execute(query, (f"%{args.term}%", args.limit))
    rows = cursor.fetchall()
    
    print(f"\n--- Search results for '{args.term}' ({len(rows)} matches) ---")
    for msg_time, sender, is_from_me, content in rows:
        direction = "OUT ->" if is_from_me else "IN  <-"
        print(f"[{msg_time}] {direction} {sender}: {content.strip()}")
    print()

def cmd_send(args):
    recipient = args.recipient
    message = args.message.replace('"', '\\"')
    
    applescript = f'''
    tell application "Messages"
        send "{message}" to participant "{recipient}"
    end tell
    '''
    
    result = subprocess.run(["osascript", "-e", applescript], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Failed to send message: {result.stderr}")
        sys.exit(1)
            
    print(f"Message sent successfully to {recipient}!")

def main():
    parser = argparse.ArgumentParser(description="CLI tool to query and send Apple Messages.")
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    # recent
    p_recent = subparsers.add_parser("recent", help="Show recent messages")
    p_recent.add_argument("-n", "--limit", type=int, default=10, help="Number of messages to display (default: 10)")
    p_recent.set_defaults(func=cmd_recent)
    
    # unread
    p_unread = subparsers.add_parser("unread", help="Show unread messages")
    p_unread.add_argument("-n", "--limit", type=int, default=15, help="Number of messages to display (default: 15)")
    p_unread.set_defaults(func=cmd_unread)
    
    # search
    p_search = subparsers.add_parser("search", help="Search messages by keyword")
    p_search.add_argument("term", type=str, help="Search keyword")
    p_search.add_argument("-n", "--limit", type=int, default=10, help="Number of messages to display")
    p_search.set_defaults(func=cmd_search)
    
    # send
    p_send = subparsers.add_parser("send", help="Send a message to a phone number or email")
    p_send.add_argument("recipient", type=str, help="Recipient phone number (e.g. +1XXXXXXXXXX) or Apple ID email")
    p_send.add_argument("message", type=str, help="The message body")
    p_send.set_defaults(func=cmd_send)
    
    args = parser.parse_args()
    args.func(args)

if __name__ == "__main__":
    main()


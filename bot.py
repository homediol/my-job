#!/usr/bin/env python3
"""
Python Bot — managed by Node.js Bot Controller API.
Checks bot.lock before starting. Outputs structured STEP logs to stdout.
"""

import os
import sys
import time
import json

LOCK_FILE = "bot.lock"

# ── Lock File Check ──────────────────────────────────────────────────────────
if os.path.exists(LOCK_FILE):
    print("STEP 1: Starting bot")
    print("STEP 1: ERROR \u2014 Lock file bot.lock exists. Another instance may be running.")
    sys.exit(1)

# ── Log helper ───────────────────────────────────────────────────────────────


def step(num, message):
    """Emit a structured STEP log line."""
    entry = {"step": num, "message": message}
    print(json.dumps(entry), flush=True)


def run():
    step(1, "Starting bot")
    time.sleep(0.5)

    step(2, "Checking login state")
    time.sleep(1.0)
    step(2, "User not logged in \u2014 proceeding to login")

    step(3, "Launching browser")
    time.sleep(1.5)
    step(3, "Browser launched successfully (headless chromium)")

    step(4, "Running automation")
    steps = [
        "Navigating to dashboard",
        "Fetching data from /api/endpoint",
        "Processing 24 records",
        "Performing cleanup tasks",
    ]
    for s in steps:
        step(4, s)
        time.sleep(0.8)

    step(5, "Completed")
    print(json.dumps({"step": 5, "message": "Bot finished successfully", "status": "ok"}), flush=True)


if __name__ == "__main__":
    try:
        run()
    except KeyboardInterrupt:
        step(5, "Interrupted by signal")
        sys.exit(0)
    except Exception as e:
        step(5, f"Error \u2014 {e}")
        sys.exit(1)


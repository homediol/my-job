"""
Playwright automation bot for winner.rw Aviator game.

Logs into https://winner.rw/en/authentication/login using phone + password,
navigates to the Aviator crash game page, and reports round data back to
the parent orchestrator via a status file or JSON output.

Architecture:
  - Runs as a subprocess managed by bot_runner.py
  - Communicates state via a shared status file (STATUS_PATH)
  - Accepts SIGTERM for graceful shutdown
"""

import json
import os
import signal
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

# ── Paths ──────────────────────────────────────────────────────────────
ROOT_DIR = Path(__file__).resolve().parent.parent
STATUS_DIR = ROOT_DIR / "data" / "bot"
STATUS_PATH = STATUS_DIR / "status.json"
CONFIG_PATH = ROOT_DIR / "data" / "bot" / "config.json"
DECISIONS_PATH = ROOT_DIR / "decisions.json"

# ── Helpers ────────────────────────────────────────────────────────────

def write_status(payload: Dict[str, Any]) -> None:
    STATUS_DIR.mkdir(parents=True, exist_ok=True)
    tmp = STATUS_PATH.with_suffix(".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    os.replace(tmp, STATUS_PATH)


def read_json(path: Path, default: Any = None) -> Any:
    try:
        if not path.exists():
            return default
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return default


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    os.replace(tmp, path)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def log(msg: str) -> None:
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] [BOT] {msg}", flush=True)


# ── Playwright helpers ─────────────────────────────────────────────────

def _start_playwright(headless: bool = False):
    """Lazy-import playright and start the sync API.
    Returns a (Playwright, Browser) tuple with a launched Chromium instance.
    """
    try:
        from playwright.sync_api import sync_playwright
        pw = sync_playwright().start()
        browser = pw.chromium.launch(
            headless=headless,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-dev-shm-usage",
            ],
        )
        return pw, browser
    except ImportError:
        log("Playwright not installed. Run: pip install playwright && playwright install chromium")
        write_status({"status": "error", "error": "playwright_not_installed", "updated_at": now_iso()})
        sys.exit(1)


# ── Shutdown flag ──────────────────────────────────────────────────────

_shutdown = False

def _handle_sigterm(signum, frame):
    global _shutdown
    _shutdown = True
    log("SIGTERM received, shutting down gracefully...")


signal.signal(signal.SIGTERM, _handle_sigterm)
signal.signal(signal.SIGINT, _handle_sigterm)


# ══════════════════════════════════════════════════════════════════════
# MAIN AUTOMATION
# ══════════════════════════════════════════════════════════════════════

def run_bot(phone: str, password: str, headless: bool = False) -> None:
    """
    Main automation entrypoint.

    1. Launches Chromium via Playwright
    2. Navigates to winner.rw login
    3. Fills phone + password and clicks login
    4. Waits for redirect / dashboard
    5. Navigates to Aviator game page
    6. Monitors rounds until shutdown signal
    """
    log(f"Starting bot for phone {phone} (headless={headless})")

    write_status({
        "status": "starting",
        "phone": phone,
        "headless": headless,
        "updated_at": now_iso(),
        "rounds_seen": 0,
        "last_round": None,
    })

    try:
        pw, browser = _start_playwright(headless=headless)

        context = browser.new_context(
            viewport={"width": 1366, "height": 768},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/125.0.0.0 Safari/537.36"
            ),
        )

        page = context.new_page()

        # ── Step 1: Navigate to login ──
        log("Navigating to login page...")
        write_status({**read_json(STATUS_PATH, {}), "status": "navigating_login"})
        page.goto("https://winner.rw/en/authentication/login", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(2000)

        # ── Step 2: Fill credentials ──
        log("Filling credentials...")
        write_status({**read_json(STATUS_PATH, {}), "status": "filling_credentials"})

        # Wait for phone input to be visible
        page.wait_for_selector("#phoneInput", timeout=15000)
        page.fill("#phoneInput", phone)
        log("Phone filled")

        # Fill password
        page.wait_for_selector("#password", timeout=10000)
        page.fill("#password", password)
        log("Password filled")

        # ── Step 3: Click login ──
        log("Clicking login button...")
        write_status({**read_json(STATUS_PATH, {}), "status": "logging_in"})
        page.wait_for_selector("#buttonLoginSubmitLabel", timeout=10000)
        page.click("#buttonLoginSubmitLabel")

        # Wait for navigation away from login page
        page.wait_for_timeout(5000)

        log("Checking login result...")

        # Detect if still on login page (failed login)
        current_url = page.url
        if "login" in current_url:
            error_text = ""
            try:
                error_el = page.query_selector(".error-message, .alert, [role=alert]")
                if error_el:
                    error_text = error_el.inner_text()
            except Exception:
                pass
            log(f"Login appears to have failed. URL: {current_url}")
            write_status({
                "status": "error",
                "error": f"Login failed. URL: {current_url}. Error: {error_text}",
                "updated_at": now_iso(),
            })
            browser.close()
            pw.stop()
            sys.exit(1)

        log(f"Login successful. Current URL: {current_url}")
        write_status({**read_json(STATUS_PATH, {}), "status": "login_success"})

        # ── Step 4: Navigate to Aviator ──
        log("Navigating to Aviator game page...")
        write_status({**read_json(STATUS_PATH, {}), "status": "navigating_aviator"})
        page.goto("https://winner.rw/en/virtual/crash-games/aviator", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(3000)

        log(f"On Aviator page. URL: {page.url}")
        write_status({
            **read_json(STATUS_PATH, {}),
            "status": "aviator_loaded",
            "aviator_url": page.url,
        })

        # ── Step 5: Monitor rounds ──
        log("Monitoring Aviator rounds...")
        write_status({**read_json(STATUS_PATH, {}), "status": "monitoring"})

        rounds_seen = 0
        last_round_id = None

        while not _shutdown:
            try:
                # Wait for the game canvas/round indicator to appear
                page.wait_for_timeout(2000)

                # Look for round/multiplier elements
                # Winner Aviator typically renders round info in specific selectors
                # Try common Aviator patterns
                round_data = None

                # Attempt to extract round data from the page
                selectors = [
                    ".crash-round",
                    ".round-number",
                    ".game-round",
                    "[class*='round']",
                    ".multiplier",
                    "[class*='multiplier']",
                    "canvas",
                ]

                for sel in selectors:
                    try:
                        el = page.query_selector(sel)
                        if el:
                            text = el.inner_text().strip()
                            if text:
                                round_data = {"selector": sel, "text": text}
                                break
                    except Exception:
                        continue

                current_url = page.url
                write_status({
                    **read_json(STATUS_PATH, {}),
                    "status": "monitoring",
                    "rounds_seen": rounds_seen,
                    "last_round": round_data,
                    "current_url": current_url,
                    "updated_at": now_iso(),
                })

                log(f"Round check... seen={rounds_seen}, url={current_url}")

                # If page navigated away from Aviator, log it
                if "aviator" not in current_url.lower() and "crash" not in current_url.lower():
                    log(f"WARNING: Navigated away from Aviator page to: {current_url}")
                    write_status({
                        **read_json(STATUS_PATH, {}),
                        "status": "navigated_away",
                        "current_url": current_url,
                        "updated_at": now_iso(),
                    })
                    # Navigate back
                    page.goto("https://winner.rw/en/virtual/crash-games/aviator", wait_until="domcontentloaded", timeout=30000)
                    page.wait_for_timeout(3000)
                    write_status({**read_json(STATUS_PATH, {}), "status": "monitoring", "updated_at": now_iso()})

            except Exception as exc:
                log(f"Monitor error: {exc}")
                write_status({
                    **read_json(STATUS_PATH, {}),
                    "status": "monitor_error",
                    "error": str(exc),
                    "updated_at": now_iso(),
                })
                page.wait_for_timeout(5000)

        # ── Clean shutdown ──
        log("Shutting down bot...")
        write_status({**read_json(STATUS_PATH, {}), "status": "stopped", "updated_at": now_iso()})
        browser.close()
        pw.stop()
        log("Bot terminated cleanly.")

    except Exception as exc:
        log(f"Fatal error: {exc}")
        write_status({
            "status": "error",
            "error": str(exc),
            "updated_at": now_iso(),
        })
        sys.exit(1)


# ══════════════════════════════════════════════════════════════════════
# CLI entrypoint
# ══════════════════════════════════════════════════════════════════════

def main():
    config = read_json(CONFIG_PATH, {})
    phone = config.get("phone", os.environ.get("WINNER_PHONE", ""))
    password = config.get("password", os.environ.get("WINNER_PASSWORD", ""))
    headless = config.get("headless", os.environ.get("WINNER_HEADLESS", "false").lower() == "true")

    if not phone or not password:
        print("ERROR: phone and password required. Set via config.json or WINNER_PHONE/WINNER_PASSWORD env vars.")
        sys.exit(1)

    run_bot(phone, password, headless=headless)


if __name__ == "__main__":
    main()




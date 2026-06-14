import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"
ROUND_HISTORY_PATH = DATA_DIR / "roundhistory.json"
DECISIONS_PATH = ROOT_DIR / "decisions.json"
LOG_PATH = Path(__file__).resolve().parent / "aviator-api.log"
METADATA_PATH = ARTIFACT_DIR / "metadata.json"

CATEGORIES = ["LOW", "MEDIUM", "HIGH"]
CATEGORY_RANGES = {
    "LOW": (1.0, 1.5),
    "MEDIUM": (1.5, 4.0),
    "HIGH": (5.0, 100.0),
}


def setup_logging() -> None:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        handlers=[
            logging.FileHandler(LOG_PATH),
            logging.StreamHandler(),
        ],
    )


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def ensure_data_files() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    if not ROUND_HISTORY_PATH.exists():
        sample = [
            {"round_id": i + 1, "multiplier": float(v), "timestamp": utc_now()}
            for i, v in enumerate(
                [
                    1.12, 1.34, 2.18, 1.06, 5.42, 1.49, 3.28, 1.22, 8.71, 2.93,
                    1.01, 1.77, 4.25, 1.38, 12.4, 2.11, 1.52, 1.09, 6.85, 3.67,
                    1.24, 1.44, 2.72, 1.15, 9.31, 1.89, 3.05, 1.18, 1.63, 7.26,
                    1.31, 2.45, 1.07, 4.92, 1.56, 14.2, 2.32, 1.28, 3.71, 1.03,
                    6.11, 1.81, 2.64, 1.41, 1.17, 10.8, 3.12, 1.35, 2.02, 5.73,
                    1.21, 1.69, 4.48, 1.11, 7.94, 2.84, 1.47, 1.25, 3.51, 11.6,
                ]
            )
        ]
        write_json(ROUND_HISTORY_PATH, sample)
    if not DECISIONS_PATH.exists():
        write_json(DECISIONS_PATH, [])


def read_json(path: Path, default: Any) -> Any:
    try:
        if not path.exists():
            return default
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except json.JSONDecodeError:
        logging.exception("Invalid JSON in %s", path)
        return default


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    with tmp_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)
    os.replace(tmp_path, path)


def load_round_history() -> List[Dict[str, Any]]:
    ensure_data_files()
    raw = read_json(ROUND_HISTORY_PATH, [])
    if isinstance(raw, dict):
        raw = raw.get("rounds", raw.get("history", []))

    rows: List[Dict[str, Any]] = []
    for index, item in enumerate(raw):
        if isinstance(item, (int, float)):
            rows.append({"round_id": index + 1, "multiplier": float(item), "timestamp": None})
        elif isinstance(item, dict):
            value = item.get("multiplier", item.get("crashPoint", item.get("value")))
            if value is None:
                continue
            rows.append(
                {
                    "round_id": item.get("round_id", item.get("round_index", item.get("id", index + 1))),
                    "multiplier": float(value),
                    "timestamp": item.get("timestamp"),
                }
            )

    cleaned = []
    for row in rows:
        multiplier = row.get("multiplier")
        if multiplier is None or multiplier < 1.0:
            continue
        cleaned.append({**row, "category": multiplier_to_category(multiplier)})
    return cleaned


def multiplier_to_category(multiplier: float) -> str:
    if multiplier < 1.5:
        return "LOW"
    if multiplier < 5.0:
        return "MEDIUM"
    return "HIGH"


def category_to_recommended_cashout(category: str, confidence: float) -> float:
    confidence_ratio = max(0.0, min(confidence, 100.0)) / 100.0
    if category == "LOW":
        return round(1.15 + 0.20 * confidence_ratio, 2)
    if category == "MEDIUM":
        return round(1.75 + 1.25 * confidence_ratio, 2)
    return round(2.5 + 2.5 * confidence_ratio, 2)


def risk_level(category: str, confidence: float) -> str:
    if confidence < 55:
        return "HIGH"
    if category == "HIGH" and confidence < 75:
        return "HIGH"
    if category == "MEDIUM" or confidence < 80:
        return "MEDIUM"
    return "LOW"


def append_decision(decision: Dict[str, Any]) -> None:
    decisions = read_json(DECISIONS_PATH, [])
    if not isinstance(decisions, list):
        decisions = []
    decisions.append(decision)
    write_json(DECISIONS_PATH, decisions[-250:])



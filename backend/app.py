import logging
from typing import Tuple

from flask import Flask, jsonify, request

from model import AviatorPredictor, TensorFlowUnavailable
from risk_engine import (
    compute_moving_averages,
    compute_risk_index,
    compute_round_summary,
    compute_volatility,
    detect_streaks,
)
from trainer import TrainingService
from utils import (
    append_decision,
    ensure_data_files,
    load_round_history,
    read_json,
    setup_logging,
    utc_now,
    DECISIONS_PATH,
    METADATA_PATH,
)


setup_logging()
ensure_data_files()

app = Flask(__name__)


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response

logger = logging.getLogger("aviator-api")
trainer = TrainingService()
predictor = trainer.predictor


def json_error(message: str, status: int = 400):
    logger.warning(message)
    return jsonify({"error": message, "status": status}), status


# ── Health ───────────────────────────────────────────────────────────

@app.get("/")
def health():
    return jsonify({"status": "online", "service": "aviator-risk-management"})


# ── Training ─────────────────────────────────────────────────────────

@app.post("/train")
def train():
    payload = request.get_json(silent=True) or {}
    epochs = int(payload.get("epochs", 30))
    try:
        return jsonify({"status": "trained", **trainer.train(epochs=epochs)})
    except TensorFlowUnavailable as exc:
        return json_error(str(exc), 503)
    except Exception as exc:
        logger.exception("Training failed")
        return json_error(f"Training failed: {exc}", 500)


@app.post("/retrain")
def retrain():
    payload = request.get_json(silent=True) or {}
    epochs = int(payload.get("epochs", 30))
    try:
        return jsonify({"status": "retrained", **trainer.train(epochs=epochs)})
    except TensorFlowUnavailable as exc:
        return json_error(str(exc), 503)
    except Exception as exc:
        logger.exception("Retraining failed")
        return json_error(f"Retraining failed: {exc}", 500)


# ── Prediction ───────────────────────────────────────────────────────

@app.get("/predict")
def predict():
    try:
        trainer.auto_retrain_if_needed()
        history = load_round_history()
        result = predictor.predict([round["multiplier"] for round in history])
        decision = {
            **result,
            "created_at": utc_now(),
            "source_round_count": int(len(history)),
        }
        append_decision(decision)
        return jsonify(decision)
    except TensorFlowUnavailable as exc:
        return json_error(str(exc), 503)
    except FileNotFoundError as exc:
        return json_error(str(exc), 404)
    except Exception as exc:
        logger.exception("Prediction failed")
        return json_error(f"Prediction failed: {exc}", 500)


# ── History ──────────────────────────────────────────────────────────

@app.get("/history")
def history():
    frame = load_round_history()
    limit = int(request.args.get("limit", 100))
    records = frame[-limit:]
    return jsonify({"count": int(len(frame)), "rounds": records})


# ── Accuracy ─────────────────────────────────────────────────────────

@app.get("/accuracy")
def accuracy():
    metadata = read_json(METADATA_PATH, {})
    decisions = read_json(DECISIONS_PATH, [])
    return jsonify(
        {
            "model": metadata,
            "prediction_count": len(decisions) if isinstance(decisions, list) else 0,
            "validation_accuracy": metadata.get("validation_accuracy", 0),
            "train_accuracy": metadata.get("train_accuracy", 0),
        }
    )


# ── Decisions / Logs ─────────────────────────────────────────────────

@app.get("/decisions")
def decisions():
    limit = int(request.args.get("limit", 50))
    payload = read_json(DECISIONS_PATH, [])
    return jsonify({"decisions": payload[-limit:] if isinstance(payload, list) else []})


# ═════════════════════════════════════════════════════════════════════
# RISK MANAGEMENT ENDPOINTS
# ═════════════════════════════════════════════════════════════════════

@app.get("/risk/overview")
def risk_overview():
    """Composite risk dashboard data."""
    try:
        rounds = load_round_history()
        multipliers = [r["multiplier"] for r in rounds]
        return jsonify({
            "summary": compute_round_summary(rounds),
            "risk": compute_risk_index(multipliers),
        })
    except Exception as exc:
        logger.exception("Risk overview failed")
        return json_error(str(exc), 500)


@app.get("/risk/volatility")
def risk_volatility():
    """Volatility metrics."""
    try:
        rounds = load_round_history()
        multipliers = [r["multiplier"] for r in rounds]
        return jsonify(compute_volatility(multipliers))
    except Exception as exc:
        logger.exception("Volatility calculation failed")
        return json_error(str(exc), 500)


@app.get("/risk/streaks")
def risk_streaks():
    """Streak detection results."""
    try:
        rounds = load_round_history()
        multipliers = [r["multiplier"] for r in rounds]
        return jsonify(detect_streaks(multipliers))
    except Exception as exc:
        logger.exception("Streak detection failed")
        return json_error(str(exc), 500)


@app.get("/risk/moving-averages")
def risk_moving_averages():
    """Moving average values."""
    try:
        rounds = load_round_history()
        multipliers = [r["multiplier"] for r in rounds]
        return jsonify(compute_moving_averages(multipliers))
    except Exception as exc:
        logger.exception("Moving average calculation failed")
        return json_error(str(exc), 500)


@app.get("/risk/history")
def risk_history():
    """
    Full history enriched with risk metrics per round (rolling).
    Useful for charts that show risk evolution over time.
    """
    try:
        rounds = load_round_history()
        limit = int(request.args.get("limit", 100))
        records = rounds[-limit:]
        multipliers = [r["multiplier"] for r in records]

        # compute rolling metrics for each position
        enriched = []
        for i in range(len(records)):
            window = multipliers[: i + 1]
            volatility = compute_volatility(window)
            streaks = detect_streaks(window)
            mas = compute_moving_averages(window)
            risk = compute_risk_index(window)
            enriched.append({
                **records[i],
                "volatility": volatility["recent_std"],
                "streak_category": streaks["current_streak"]["category"],
                "streak_length": streaks["current_streak"]["length"],
                "sma_5": mas["sma_5"],
                "sma_10": mas["sma_10"],
                "risk_score": risk["risk_score"],
                "risk_level": risk["risk_level"],
            })

        return jsonify({"count": len(enriched), "rounds": enriched})
    except Exception as exc:
        logger.exception("Risk history failed")
        return json_error(str(exc), 500)


# ── Entry point ──────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


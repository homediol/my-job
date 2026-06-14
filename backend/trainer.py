import logging
from typing import Dict

from model import AviatorPredictor
from utils import load_round_history, read_json, utc_now, write_json, METADATA_PATH


class TrainingService:
    def __init__(self) -> None:
        self.logger = logging.getLogger(self.__class__.__name__)
        self.predictor = AviatorPredictor()

    def train(self, epochs: int = 30, force: bool = True) -> Dict[str, object]:
        history = load_round_history()
        if not history:
            raise ValueError("roundhistory.json does not contain valid multiplier data.")

        multipliers = [round["multiplier"] for round in history]
        metrics = self.predictor.train(multipliers, epochs=epochs)
        metadata = {
            "last_trained_at": utc_now(),
            "rounds_seen": int(len(history)),
            "epochs": epochs,
            **metrics,
        }
        write_json(METADATA_PATH, metadata)
        self.logger.info("Model trained with %s samples", metrics["samples"])
        return metadata

    def should_retrain(self, min_new_rounds: int = 25) -> bool:
        metadata = read_json(METADATA_PATH, {})
        history = load_round_history()
        if not metadata:
            return True
        return int(len(history)) - int(metadata.get("rounds_seen", 0)) >= min_new_rounds

    def auto_retrain_if_needed(self) -> Dict[str, object]:
        if self.should_retrain():
            return {"retrained": True, "metadata": self.train(epochs=20)}
        return {"retrained": False, "metadata": read_json(METADATA_PATH, {})}

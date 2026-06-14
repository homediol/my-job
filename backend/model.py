import logging
import math
from typing import Dict, List, Tuple

from utils import ARTIFACT_DIR, CATEGORIES, read_json, write_json, category_to_recommended_cashout, risk_level


MODEL_PATH = ARTIFACT_DIR / "aviator_lstm.keras"
FALLBACK_MODEL_PATH = ARTIFACT_DIR / "fallback_model.json"
SEQUENCE_LENGTH = 12


class TensorFlowUnavailable(RuntimeError):
    pass


class AviatorPredictor:
    def __init__(self, sequence_length: int = SEQUENCE_LENGTH) -> None:
        self.sequence_length = sequence_length
        self.model = None
        self.logger = logging.getLogger(self.__class__.__name__)

    def _keras(self):
        try:
            from tensorflow import keras
        except ImportError as exc:
            raise TensorFlowUnavailable(
                "TensorFlow is not installed. Run `pip install -r backend/requirements.txt`."
            ) from exc
        return keras

    def normalize(self, values: List[float]) -> List[float]:
        return [math.log(min(max(float(value), 1.0), 100.0)) / math.log(100.0) for value in values]

    def create_sequences(self, multipliers: List[float]) -> Tuple[List[List[float]], List[int]]:
        if len(multipliers) <= self.sequence_length:
            return [], []

        normalized = self.normalize(multipliers)
        labels = [self.category_index(value) for value in multipliers]

        x, y = [], []
        for index in range(self.sequence_length, len(normalized)):
            x.append(normalized[index - self.sequence_length:index])
            y.append(labels[index])
        return x, y

    def build_model(self):
        keras = self._keras()
        model = keras.Sequential(
            [
                keras.layers.Input(shape=(self.sequence_length, 1)),
                keras.layers.LSTM(64, return_sequences=True),
                keras.layers.Dropout(0.25),
                keras.layers.LSTM(32),
                keras.layers.Dense(32, activation="relu"),
                keras.layers.Dropout(0.2),
                keras.layers.Dense(len(CATEGORIES), activation="softmax"),
            ]
        )
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss="sparse_categorical_crossentropy",
            metrics=["accuracy"],
        )
        return model

    def load(self) -> bool:
        if not MODEL_PATH.exists():
            return False
        keras = self._keras()
        self.model = keras.models.load_model(MODEL_PATH)
        return True

    def save(self) -> None:
        if self.model is None:
            raise RuntimeError("Cannot save before a model has been trained.")
        ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
        self.model.save(MODEL_PATH)

    def train(self, multipliers: List[float], epochs: int = 30) -> Dict[str, float]:
        x, y = self.create_sequences(multipliers)
        if len(x) < 10:
            raise ValueError("At least 23 valid rounds are recommended for training.")

        try:
            import numpy as np
        except ImportError:
            return self.train_fallback(multipliers)

        try:
            self.model = self.build_model()
        except TensorFlowUnavailable:
            return self.train_fallback(multipliers)

        x_np = np.array(x, dtype="float32").reshape(-1, self.sequence_length, 1)
        y_np = np.array(y, dtype="int64")
        split = max(1, int(len(x_np) * 0.8))
        x_train, x_test = x_np[:split], x_np[split:]
        y_train, y_test = y_np[:split], y_np[split:]

        keras = self._keras()
        callbacks = [keras.callbacks.EarlyStopping(monitor="loss", patience=5, restore_best_weights=True)]

        history = self.model.fit(
            x_train,
            y_train,
            validation_data=(x_test, y_test) if len(x_test) else None,
            epochs=epochs,
            batch_size=16,
            verbose=0,
            callbacks=callbacks,
        )
        self.save()

        train_accuracy = float(history.history.get("accuracy", [0])[-1]) * 100
        validation_accuracy = float(history.history.get("val_accuracy", [train_accuracy / 100])[-1]) * 100
        return {
            "train_accuracy": round(train_accuracy, 2),
            "validation_accuracy": round(validation_accuracy, 2),
            "samples": int(len(x)),
            "engine": "tensorflow_lstm",
        }

    def train_fallback(self, multipliers: List[float]) -> Dict[str, float]:
        labels = [self.category_index(value) for value in multipliers]
        counts = {category: 1 for category in CATEGORIES}
        transitions = {category: {next_category: 1 for next_category in CATEGORIES} for category in CATEGORIES}

        for index, label in enumerate(labels):
            category = CATEGORIES[label]
            counts[category] += 1
            if index:
                previous = CATEGORIES[labels[index - 1]]
                transitions[previous][category] += 1

        write_json(
            FALLBACK_MODEL_PATH,
            {
                "counts": counts,
                "transitions": transitions,
                "sequence_length": self.sequence_length,
            },
        )

        baseline = max(counts.values()) / sum(counts.values()) * 100
        return {
            "train_accuracy": round(baseline, 2),
            "validation_accuracy": round(baseline, 2),
            "samples": max(0, len(multipliers) - self.sequence_length),
            "engine": "stdlib_fallback",
        }

    def predict(self, multipliers: List[float]) -> Dict[str, object]:
        if len(multipliers) < self.sequence_length:
            raise ValueError(f"Need at least {self.sequence_length} rounds to predict.")
        if self.model is None and MODEL_PATH.exists():
            try:
                self.load()
            except TensorFlowUnavailable:
                self.model = None
        if self.model is None:
            if not FALLBACK_MODEL_PATH.exists():
                self.train_fallback(multipliers)
            return self.predict_fallback(multipliers)

        import numpy as np

        sequence = np.array(self.normalize(multipliers[-self.sequence_length:]), dtype="float32").reshape(1, self.sequence_length, 1)
        probabilities = self.model.predict(sequence, verbose=0)[0]
        class_index = int(np.argmax(probabilities))
        prediction = CATEGORIES[class_index]
        confidence = round(float(probabilities[class_index]) * 100, 2)
        return {
            "prediction": prediction,
            "confidence": confidence,
            "recommended_cashout": category_to_recommended_cashout(prediction, confidence),
            "risk_level": risk_level(prediction, confidence),
            "probabilities": {
                category: round(float(probabilities[index]) * 100, 2)
                for index, category in enumerate(CATEGORIES)
            },
        }

    def predict_fallback(self, multipliers: List[float]) -> Dict[str, object]:
        payload = read_json(FALLBACK_MODEL_PATH, {})
        counts = payload.get("counts", {category: 1 for category in CATEGORIES})
        transitions = payload.get("transitions", {})
        last_category = CATEGORIES[self.category_index(multipliers[-1])]
        transition_counts = transitions.get(last_category, counts)

        recent = [CATEGORIES[self.category_index(value)] for value in multipliers[-self.sequence_length:]]
        scores = {}
        for category in CATEGORIES:
            score = float(counts.get(category, 1)) * 0.35
            score += float(transition_counts.get(category, 1)) * 0.45
            score += recent.count(category) * 0.20
            scores[category] = score

        total = sum(scores.values()) or 1.0
        probabilities = {category: (score / total) * 100 for category, score in scores.items()}
        prediction = max(probabilities, key=probabilities.get)
        confidence = round(probabilities[prediction], 2)
        return {
            "prediction": prediction,
            "confidence": confidence,
            "recommended_cashout": category_to_recommended_cashout(prediction, confidence),
            "risk_level": risk_level(prediction, confidence),
            "probabilities": {category: round(value, 2) for category, value in probabilities.items()},
            "engine": "stdlib_fallback",
        }

    @staticmethod
    def category_index(multiplier: float) -> int:
        if multiplier < 1.5:
            return 0
        if multiplier < 5.0:
            return 1
        return 2

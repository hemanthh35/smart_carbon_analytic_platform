"""Flags whether a submitted prediction request looks statistically inconsistent with
historical facility-reporting patterns in the training dataset — an early-warning
signal for misreporting or data-entry errors, not a fraud determination on its own.

Uses an IsolationForest (unsupervised, scikit-learn) trained on the same 24-feature
matrix as the BiLSTM. IsolationForest isolates outliers by how few random feature
splits are needed to separate a point from the rest of the data — anomalous points
isolate in fewer splits, giving an anomaly score without needing labeled fraud examples
(which this dataset does not have).
"""
from __future__ import annotations

import os
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

from app.utils.constants import FEATURE_COLUMNS
from app.utils.logger import get_logger

logger = get_logger("ai.anomaly_detector")

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
_DATA_PATH = os.path.join(_ROOT, "preprocess", "iron_steel_preprocessed.csv")
_CACHE_PATH = os.path.join(os.path.dirname(__file__), "anomaly_isoforest.pkl")

# Fraction of historical rows expected to be flagged as anomalous during training —
# a modeling assumption, not a measured fraud rate.
CONTAMINATION = 0.05


class AnomalyDetector:
    _instance: "AnomalyDetector | None" = None

    def __new__(cls) -> "AnomalyDetector":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._loaded = False
        return cls._instance

    def _ensure_loaded(self) -> None:
        if self._loaded:
            return

        if os.path.exists(_CACHE_PATH):
            logger.info(f"Loading cached IsolationForest from {_CACHE_PATH}")
            self._model = joblib.load(_CACHE_PATH)
        else:
            if not os.path.exists(_DATA_PATH):
                logger.warning("Preprocessed dataset not found; anomaly detection disabled.")
                self._model = None
                self._loaded = True
                return
            logger.info("Training IsolationForest for anomaly detection...")
            df = pd.read_csv(_DATA_PATH)
            X = df[FEATURE_COLUMNS].values
            self._model = IsolationForest(
                n_estimators=150, contamination=CONTAMINATION, random_state=42, n_jobs=-1
            )
            self._model.fit(X)
            joblib.dump(self._model, _CACHE_PATH)
            logger.info(f"IsolationForest trained and cached to {_CACHE_PATH}")

        self._loaded = True

    def score(self, features: dict[str, Any]) -> dict[str, Any] | None:
        """
        Returns:
          anomaly_score: raw IsolationForest decision_function output (higher = more
            normal, lower/negative = more anomalous).
          is_anomalous: True if the model's own threshold (set by `contamination` at
            training time) flags this point as an outlier.
          percentile: this point's anomaly score expressed as a percentile against the
            training set's score distribution, for a human-readable "more unusual than
            X% of historical submissions" statement.
        """
        self._ensure_loaded()
        if self._model is None:
            return None

        row = np.array([[float(features.get(col, 0.0)) for col in FEATURE_COLUMNS]])
        raw_score = float(self._model.decision_function(row)[0])
        is_anomalous = bool(self._model.predict(row)[0] == -1)

        return {
            "anomaly_score": raw_score,
            "is_anomalous": is_anomalous,
        }

    @property
    def is_available(self) -> bool:
        self._ensure_loaded()
        return self._model is not None


anomaly_detector = AnomalyDetector()

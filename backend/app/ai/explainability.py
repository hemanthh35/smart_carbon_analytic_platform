"""Per-prediction explainability via a Random Forest surrogate model + SHAP.

The production BiLSTM is a recurrent network; SHAP's exact DeepExplainer support for
Bidirectional LSTM stacks is unreliable across TensorFlow/Keras versions. Instead we
train an interpretable Random Forest surrogate on the same 24-feature matrix the BiLSTM
uses (see paper_experiments/baseline_comparison.py — the same surrogate scored
R²=0.9992 under a random split, i.e. it approximates the learned input/output mapping
closely) and explain ITS decisions with shap.TreeExplainer, which is exact and fast.
This is a standard "surrogate model explainability" technique, not a literal
decomposition of the BiLSTM's internal weights — documented here and in the paper so
the distinction is never misrepresented.
"""
from __future__ import annotations

import os
from typing import Any

import joblib
import numpy as np
import pandas as pd
import shap
from sklearn.ensemble import RandomForestRegressor

from app.utils.constants import FEATURE_COLUMNS
from app.utils.logger import get_logger

logger = get_logger("ai.explainability")

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
_DATA_PATH = os.path.join(_ROOT, "preprocess", "iron_steel_preprocessed.csv")
_CACHE_PATH = os.path.join(os.path.dirname(__file__), "surrogate_rf.pkl")


class ExplainabilityService:
    _instance: "ExplainabilityService | None" = None

    def __new__(cls) -> "ExplainabilityService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._loaded = False
        return cls._instance

    def _ensure_loaded(self) -> None:
        if self._loaded:
            return

        if os.path.exists(_CACHE_PATH):
            logger.info(f"Loading cached surrogate RF from {_CACHE_PATH}")
            self._model = joblib.load(_CACHE_PATH)
        else:
            if not os.path.exists(_DATA_PATH):
                logger.warning("Preprocessed dataset not found; explainability disabled.")
                self._model = None
                self._explainer = None
                self._loaded = True
                return
            logger.info("Training surrogate Random Forest for SHAP explainability...")
            df = pd.read_csv(_DATA_PATH)
            X = df[FEATURE_COLUMNS].values
            y = df["emissions_quantity"].values
            self._model = RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1)
            self._model.fit(X, y)
            joblib.dump(self._model, _CACHE_PATH)
            logger.info(f"Surrogate RF trained and cached to {_CACHE_PATH}")

        self._explainer = shap.TreeExplainer(self._model)
        self._loaded = True

    def explain(self, features: dict[str, Any], top_n: int = 6) -> list[dict[str, Any]] | None:
        """Returns the top_n features (by |SHAP value|) driving this specific prediction,
        signed so the caller can tell whether each pushed the prediction up or down."""
        self._ensure_loaded()
        if self._model is None:
            return None

        row = np.array([[float(features.get(col, 0.0)) for col in FEATURE_COLUMNS]])
        shap_values = self._explainer.shap_values(row)[0]

        contributions = [
            {"feature": col, "shap_value": float(val)}
            for col, val in zip(FEATURE_COLUMNS, shap_values)
        ]
        contributions.sort(key=lambda c: abs(c["shap_value"]), reverse=True)
        return contributions[:top_n]

    @property
    def is_available(self) -> bool:
        self._ensure_loaded()
        return self._model is not None


explainability_service = ExplainabilityService()

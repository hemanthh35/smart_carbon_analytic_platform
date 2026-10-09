"""Per-prediction BiLSTM explainability with integrated-gradient attribution.

The attribution is computed directly from the loaded BiLSTM with TensorFlow's
gradient tape. No secondary regression model is trained, so the explanation is
attached to the same forecast that the API returns.
"""
from __future__ import annotations

from typing import Any

import numpy as np

from app.ai.inference import inference_engine
from app.utils.constants import FEATURE_COLUMNS
from app.utils.logger import get_logger

logger = get_logger("ai.explainability")


class ExplainabilityService:
    _instance: "ExplainabilityService | None" = None

    def __new__(cls) -> "ExplainabilityService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._loaded = False
            cls._instance._model = None
        return cls._instance

    def _ensure_loaded(self) -> None:
        if self._loaded:
            return

        if not inference_engine.is_loaded:
            logger.warning("BiLSTM is not loaded; explainability is unavailable.")
            self._loaded = True
            return

        self._model = inference_engine._model
        self._loaded = True
        logger.info("Direct BiLSTM integrated-gradient attribution is ready.")

    def explain(self, features: dict[str, Any], top_n: int = 6) -> list[dict[str, Any]] | None:
        """Return the top features by signed integrated-gradient attribution.

        The existing ``shap_value`` response key is retained for API compatibility
        with the dashboard, but the values are direct BiLSTM attributions rather
        than explanations from a secondary model.
        """
        self._ensure_loaded()
        if self._model is None:
            return None

        import tensorflow as tf

        row = np.array(
            [[float(features.get(col, 0.0)) for col in FEATURE_COLUMNS]],
            dtype=np.float32,
        )
        scaled = inference_engine._scaler.transform(row).astype(np.float32)
        sample = scaled.reshape(1, len(FEATURE_COLUMNS), 1)
        baseline = np.zeros_like(sample)
        steps = 8
        alpha = tf.linspace(0.0, 1.0, steps)[:, None, None, None]
        inputs = baseline[None, ...] + alpha * (sample[None, ...] - baseline[None, ...])
        inputs = tf.reshape(inputs, (steps, len(FEATURE_COLUMNS), 1))

        with tf.GradientTape() as tape:
            tape.watch(inputs)
            predictions = self._model(inputs, training=False)
        gradients = tape.gradient(predictions, inputs).numpy()
        average_gradients = (gradients[:-1] + gradients[1:]).mean(axis=0) / 2.0
        # Gradients have shape (steps, features, 1); after averaging over the
        # integration steps, the result is (features, 1).
        attributions = ((sample - baseline)[0, :, 0] * average_gradients[:, 0]).tolist()

        contributions = [
            {"feature": col, "shap_value": float(value)}
            for col, value in zip(FEATURE_COLUMNS, attributions)
        ]
        contributions.sort(key=lambda item: abs(item["shap_value"]), reverse=True)
        return contributions[:top_n]

    @property
    def is_available(self) -> bool:
        self._ensure_loaded()
        return self._model is not None


explainability_service = ExplainabilityService()

"""BiLSTM model inference singleton — rebuilds architecture and loads weights to bypass quantization_config bug."""
from __future__ import annotations

import os
import zipfile
import tempfile
from typing import Any

import joblib
import numpy as np

from app.utils.constants import FEATURE_COLUMNS, FEATURE_DEFAULTS
from app.utils.logger import get_logger

logger = get_logger("ai.inference")

# Number of features in the model input
NUM_FEATURES = len(FEATURE_COLUMNS)  # 24


def _build_model(input_shape: tuple):
    """Rebuild the exact BiLSTM architecture from the notebook."""
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import (
        Bidirectional, LSTM, Dense, Dropout, BatchNormalization
    )

    model = Sequential([
        Bidirectional(
            LSTM(128, return_sequences=True),
            input_shape=input_shape,
        ),
        BatchNormalization(),
        Dropout(0.3),
        Bidirectional(
            LSTM(64, return_sequences=False),
        ),
        BatchNormalization(),
        Dropout(0.2),
        Dense(64, activation="relu"),
        Dense(32, activation="relu"),
        Dense(1),
    ])
    return model


class ModelInference:
    """Singleton wrapper around the BiLSTM model and MinMaxScaler."""

    _instance: "ModelInference | None" = None

    def __new__(cls) -> "ModelInference":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._loaded = False
        return cls._instance

    def load(self, model_path: str, scaler_path: str) -> None:
        """Load model weights and scaler. Called once on app startup."""
        if self._loaded:
            return

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found: {model_path}")
        if not os.path.exists(scaler_path):
            raise FileNotFoundError(f"Scaler not found: {scaler_path}")

        # ── Step 1: Rebuild the architecture ──────────────────────────────────
        input_shape = (NUM_FEATURES, 1)
        logger.info(f"Rebuilding BiLSTM architecture, input_shape={input_shape}")
        self._model = _build_model(input_shape=input_shape)

        # ── Step 2: Extract weights from the .keras file (it's a ZIP) ─────────
        logger.info(f"Extracting weights from: {model_path}")
        with tempfile.TemporaryDirectory() as tmpdir:
            with zipfile.ZipFile(model_path, "r") as zf:
                zf.extractall(tmpdir)
            weights_path = os.path.join(tmpdir, "model.weights.h5")
            if not os.path.exists(weights_path):
                # Fallback: try loading via tf.saved_model H5 keys
                # List files for debug
                extracted = os.listdir(tmpdir)
                logger.info(f"Contents of .keras archive: {extracted}")
                # Try any .h5 or .weights.h5
                h5_files = [f for f in extracted if f.endswith(".h5")]
                if h5_files:
                    weights_path = os.path.join(tmpdir, h5_files[0])
                else:
                    raise FileNotFoundError(f"No weights file found in {model_path}. Files: {extracted}")

            self._model.load_weights(weights_path)
            logger.info("Weights loaded successfully.")

        # ── Step 3: Load the scaler ────────────────────────────────────────────
        logger.info(f"Loading scaler from: {scaler_path}")
        self._scaler = joblib.load(scaler_path)
        logger.info("Scaler loaded successfully.")

        # ── Step 4: Warm-up inference ──────────────────────────────────────────
        dummy = np.zeros((1, NUM_FEATURES, 1), dtype=np.float32)
        self._model.predict(dummy, verbose=0)
        logger.info("Model warm-up complete.")

        self._loaded = True
        logger.info("BiLSTM model ready for inference.")

    def predict(self, features: dict[str, Any]) -> float:
        """
        Run inference on a feature dict.

        Args:
            features: Dict with keys matching FEATURE_COLUMNS.
                      Missing keys are filled with FEATURE_DEFAULTS.

        Returns:
            Predicted emission in original scale (reversed log1p).
        """
        if not self._loaded:
            raise RuntimeError("Model not loaded. Call load() first.")

        # Build feature vector in correct column order
        row = []
        for col in FEATURE_COLUMNS:
            val = features.get(col, FEATURE_DEFAULTS.get(col, 0.0))
            row.append(float(val))

        X = np.array([row], dtype=np.float32)                  # shape: (1, 24)
        X_scaled = self._scaler.transform(X)                    # shape: (1, 24)
        X_reshaped = X_scaled.reshape(1, X_scaled.shape[1], 1) # shape: (1, 24, 1)

        log_pred = self._model.predict(X_reshaped, verbose=0).flatten()[0]
        emission = float(np.expm1(log_pred))   # reverse log1p transform
        emission = max(0.0, emission)           # clamp negatives
        return emission

    @property
    def is_loaded(self) -> bool:
        return self._loaded


# Module-level singleton
inference_engine = ModelInference()

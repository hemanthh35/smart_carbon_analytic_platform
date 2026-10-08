# -*- coding: utf-8 -*-
"""
Retrains the same BiLSTM architecture used in app/ai/inference.py, but under a
facility-held-out (grouped) 80/20 split instead of a random row-level split, so its
reported metrics are directly comparable to the baselines in baseline_comparison.py
under the same protocol (Table IV in the paper).

Run from the Minor_Project root:
    python paper_experiments/train_bilstm_group_split.py
Results are written to paper_experiments/results/bilstm_group_split_results.json
"""
import json
import os

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.layers import Bidirectional, LSTM, Dense, Dropout, BatchNormalization
from tensorflow.keras.models import Sequential

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(ROOT, "preprocess", "iron_steel_preprocessed.csv")
RESULTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "results")
os.makedirs(RESULTS_DIR, exist_ok=True)

FEATURE_COLUMNS = [
    "iso3_country", "source_type", "sector", "subsector", "gas", "activity", "activity_units",
    "emissions_factor", "emissions_factor_units", "capacity", "capacity_units", "capacity_factor",
    "lat", "lon", "year", "month", "quarter",
    "emission_lag_1", "emission_lag_3", "emission_lag_6", "emission_lag_12",
    "rolling_mean_3", "rolling_mean_6", "rolling_mean_12",
]


def main():
    df = pd.read_csv(DATA_PATH)
    X = df[FEATURE_COLUMNS].values
    y = df["emissions_quantity"].values
    groups = df["source_id"].values

    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups))
    X_train, X_test = X[train_idx], X[test_idx]
    y_train, y_test = y[train_idx], y[test_idx]

    scaler = MinMaxScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)
    X_train_r = X_train_s.reshape(-1, 24, 1)
    X_test_r = X_test_s.reshape(-1, 24, 1)

    model = Sequential([
        Bidirectional(LSTM(128, return_sequences=True), input_shape=(24, 1)),
        BatchNormalization(), Dropout(0.3),
        Bidirectional(LSTM(64, return_sequences=False)),
        BatchNormalization(), Dropout(0.2),
        Dense(64, activation="relu"),
        Dense(32, activation="relu"),
        Dense(1),
    ])
    model.compile(optimizer="adam", loss="mse", metrics=["mae"])

    es = EarlyStopping(monitor="val_loss", patience=5, restore_best_weights=True)
    rlp = ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3)

    history = model.fit(
        X_train_r, y_train, validation_split=0.1, epochs=30, batch_size=320,
        callbacks=[es, rlp], verbose=2,
    )

    pred = model.predict(X_test_r, verbose=0).flatten()
    results = {
        "train_facilities": len(set(groups[train_idx])),
        "test_facilities": len(set(groups[test_idx])),
        "facility_overlap": len(set(groups[train_idx]) & set(groups[test_idx])),
        "epochs_trained": len(history.history["loss"]),
        "R2": float(r2_score(y_test, pred)),
        "RMSE": float(np.sqrt(mean_squared_error(y_test, pred))),
        "MAE": float(mean_absolute_error(y_test, pred)),
    }

    out_path = os.path.join(RESULTS_DIR, "bilstm_group_split_results.json")
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)
    print(json.dumps(results, indent=2))
    print(f"\nSaved to {out_path}")


if __name__ == "__main__":
    main()

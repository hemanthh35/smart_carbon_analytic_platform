# -*- coding: utf-8 -*-
"""
Baseline comparison experiments for the IEEE paper (Section VI: Results and Discussion).

Trains Linear Regression and Random Forest on the same 24-feature matrix used by the
BiLSTM, under two evaluation protocols:
  1. Random row-level 80/20 split (what the original BiLSTM training notebook used)
  2. Facility-held-out (grouped) 80/20 split via GroupShuffleSplit on source_id

Also extracts Random Forest feature importances for Table II.

Run from the Minor_Project root:
    python paper_experiments/baseline_comparison.py
Results are written to paper_experiments/results/baseline_comparison_results.json
"""
import json
import os
import time

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GroupShuffleSplit, train_test_split

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


def metrics(y_true, y_pred):
    return {
        "R2": float(r2_score(y_true, y_pred)),
        "RMSE": float(np.sqrt(mean_squared_error(y_true, y_pred))),
        "MAE": float(mean_absolute_error(y_true, y_pred)),
    }


def main():
    df = pd.read_csv(DATA_PATH)
    X = df[FEATURE_COLUMNS].values
    y = df["emissions_quantity"].values  # already log1p-transformed
    groups = df["source_id"].values

    results = {"dataset": {"rows": len(df), "facilities": int(df["source_id"].nunique())}}

    # ---- Protocol 1: random row-level split ----
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    lr = LinearRegression()
    lr.fit(X_train, y_train)
    results["random_split"] = {"Linear Regression": metrics(y_test, lr.predict(X_test))}

    rf = RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1)
    t0 = time.time()
    rf.fit(X_train, y_train)
    fit_time = time.time() - t0
    results["random_split"]["Random Forest"] = metrics(y_test, rf.predict(X_test))
    results["random_split"]["Random Forest"]["fit_time_s"] = fit_time

    # Feature importances (fit on full dataset for the reported table)
    rf_full = RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1)
    rf_full.fit(X, y)
    importances = sorted(zip(FEATURE_COLUMNS, rf_full.feature_importances_), key=lambda x: -x[1])
    results["feature_importance"] = [{"feature": f, "importance": float(i)} for f, i in importances]

    # ---- Protocol 2: facility-held-out (group) split ----
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups))
    Xg_train, Xg_test = X[train_idx], X[test_idx]
    yg_train, yg_test = y[train_idx], y[test_idx]

    results["group_split"] = {
        "train_facilities": len(set(groups[train_idx])),
        "test_facilities": len(set(groups[test_idx])),
        "facility_overlap": len(set(groups[train_idx]) & set(groups[test_idx])),
    }

    lr_g = LinearRegression()
    lr_g.fit(Xg_train, yg_train)
    results["group_split"]["Linear Regression"] = metrics(yg_test, lr_g.predict(Xg_test))

    rf_g = RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1)
    rf_g.fit(Xg_train, yg_train)
    results["group_split"]["Random Forest"] = metrics(yg_test, rf_g.predict(Xg_test))

    out_path = os.path.join(RESULTS_DIR, "baseline_comparison_results.json")
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)
    print(json.dumps(results, indent=2))
    print(f"\nSaved to {out_path}")


if __name__ == "__main__":
    main()

"""Builds the 24-feature model input dict from a SimplePredictionInput payload.

Extracted from routers/prediction.py so the same logic can be reused by /predict,
and by the AI insight endpoints (SHAP explanation, anomaly detection, AI narrative)
that need the identical feature vector without duplicating the encoding logic.
"""
from __future__ import annotations

from typing import Any

from app.schemas.prediction import SimplePredictionInput
from app.services.dataset_service import dataset_service
from app.utils.constants import FEATURE_DEFAULTS


def build_feature_dict(payload: SimplePredictionInput) -> dict[str, Any]:
    features = dict(FEATURE_DEFAULTS)

    # Replace dataset-wide median defaults with this facility's REAL historical context
    # (lags, rolling means, emissions_factor, units, next period) when a facility was selected.
    if payload.source_id is not None:
        history = dataset_service.get_facility_history(payload.source_id)
        if history:
            features.update(history)

    # Dynamic Label Encoding from dataset_service alphabetical sorted lists
    if payload.iso3_country:
        unique_countries = [c["code"] for c in dataset_service.get_countries()]
        if payload.iso3_country in unique_countries:
            features["iso3_country"] = unique_countries.index(payload.iso3_country)

    if payload.source_type:
        unique_source_types = dataset_service.get_source_types()
        if payload.source_type in unique_source_types:
            features["source_type"] = unique_source_types.index(payload.source_type)

    if payload.sector:
        unique_sectors = dataset_service.get_sectors()
        if payload.sector in unique_sectors:
            features["sector"] = unique_sectors.index(payload.sector)

    if payload.subsector:
        unique_subsectors = dataset_service.get_subsectors()
        if payload.subsector in unique_subsectors:
            features["subsector"] = unique_subsectors.index(payload.subsector)

    # Gas is co2e_100yr (always index 0)
    features["gas"] = 0

    features.update({
        # The model was trained on 'activity' as a label-encoded category index (0-45205), not raw
        # tonnage — raw tonnage here would overflow the scaler's trained range and blow up the
        # prediction. encode_activity() maps it into the valid range.
        "activity": dataset_service.encode_activity(payload.activity),
        "capacity": payload.capacity,
        "capacity_factor": payload.capacity_factor,
        "lat": payload.lat,
        "lon": payload.lon,
    })
    return features

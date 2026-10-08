"""Prediction schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class SimplePredictionInput(BaseModel):
    """Simplified prediction endpoint supporting dynamic dropdown options."""
    activity: float = Field(..., description="Activity level")
    capacity: float = Field(..., description="Plant capacity")
    capacity_factor: float = Field(..., ge=0.0, le=1.0, description="Capacity utilization factor 0–1")
    lat: float = Field(..., ge=-90.0, le=90.0, description="Latitude")
    lon: float = Field(..., ge=-180.0, le=180.0, description="Longitude")
    facility_name: str = Field("Unknown Facility", max_length=255)
    country: str | None = Field(None, max_length=100)
    iso3_country: str | None = Field(None, description="ISO3 country code")
    source_type: str | None = Field(None, description="Source type")
    sector: str | None = Field(None, description="Sector")
    subsector: str | None = Field(None, description="Subsector")
    gas: str | None = Field(None, description="Gas type")
    baseline_emission: float | None = Field(None, description="Baseline emission for credit calc")
    source_id: int | None = Field(
        None, description="Facility source_id — used to look up its real emission history "
                           "(lags/rolling means) instead of dataset-wide defaults"
    )


class FullPredictionInput(BaseModel):
    """Full 24-feature prediction input (all label-encoded values required)."""
    iso3_country: int
    source_type: int
    sector: int
    subsector: int
    gas: int
    activity: int
    activity_units: int
    emissions_factor: float
    emissions_factor_units: int
    capacity: float
    capacity_units: int
    capacity_factor: float
    lat: float
    lon: float
    year: int
    month: int = Field(..., ge=1, le=12)
    quarter: int = Field(..., ge=1, le=4)
    emission_lag_1: float
    emission_lag_3: float
    emission_lag_6: float
    emission_lag_12: float
    rolling_mean_3: float
    rolling_mean_6: float
    rolling_mean_12: float
    facility_name: str = Field("Unknown Facility", max_length=255)
    country: str | None = None
    baseline_emission: float | None = None


class FeatureContribution(BaseModel):
    feature: str
    shap_value: float


class AnomalyResult(BaseModel):
    anomaly_score: float
    is_anomalous: bool


class PredictionInsights(BaseModel):
    predicted_emission: float
    top_features: list[FeatureContribution] | None = None
    anomaly: AnomalyResult | None = None
    narrative: str | None = Field(
        None, description="AI-generated plain-English summary (local Ollama llama3.2:3b). "
                           "None if Ollama was unreachable."
    )


class PredictionOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    user_id: int
    facility_name: str
    country: str | None
    predicted_emission: float
    baseline_emission: float | None
    created_at: datetime

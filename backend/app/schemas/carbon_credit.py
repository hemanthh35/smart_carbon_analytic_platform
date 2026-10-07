"""Carbon credit schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class CarbonCreditRequest(BaseModel):
    prediction_id: int = Field(..., description="ID of an existing prediction")
    baseline_emission: float = Field(..., gt=0, description="Baseline emission value")


class CarbonCreditOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    prediction_id: int
    baseline_emission: float
    predicted_emission: float
    reduction: float
    carbon_credits: float
    created_at: datetime


class PredictionBrief(BaseModel):
    model_config = {"from_attributes": True}

    facility_name: str
    country: str | None


class CarbonCreditDetailsOut(CarbonCreditOut):
    prediction: PredictionBrief


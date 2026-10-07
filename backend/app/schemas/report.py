"""Report schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ReportGenerateRequest(BaseModel):
    prediction_id: int = Field(..., description="Prediction to generate a report for")
    report_type: str = Field("general", description="Report type: general, facility, country")


class ReportOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    user_id: int
    pdf_path: str
    report_type: str
    generated_at: datetime
    pdf_url: str | None = None


class ReportListResponse(BaseModel):
    total: int
    reports: list[ReportOut]

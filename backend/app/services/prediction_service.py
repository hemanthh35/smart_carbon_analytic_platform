"""Prediction service — runs inference and persists result."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.ai.inference import inference_engine
from app.models.audit_log import AuditLog
from app.models.prediction import Prediction
from app.utils.constants import AuditActions
from app.utils.logger import get_logger

logger = get_logger("services.prediction")


def run_prediction(
    db: Session,
    user_id: int,
    features: dict,
    facility_name: str = "Unknown",
    country: str | None = None,
    baseline_emission: float | None = None,
    ip_address: str = "unknown",
) -> Prediction:
    """Run BiLSTM inference and save the prediction record."""
    predicted_emission = inference_engine.predict(features)
    logger.info(f"User {user_id}: predicted_emission={predicted_emission:.2f}")

    prediction = Prediction(
        user_id=user_id,
        facility_name=facility_name,
        country=country,
        predicted_emission=predicted_emission,
        baseline_emission=baseline_emission,
    )
    db.add(prediction)

    audit = AuditLog(user_id=user_id, action=AuditActions.PREDICT, ip_address=ip_address)
    db.add(audit)
    db.commit()
    db.refresh(prediction)
    return prediction

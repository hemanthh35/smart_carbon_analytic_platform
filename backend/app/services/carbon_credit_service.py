"""Carbon credit computation service."""
from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.carbon_credit import CarbonCredit
from app.models.prediction import Prediction
from app.utils.logger import get_logger

logger = get_logger("services.carbon_credit")


def compute_carbon_credits(
    db: Session,
    prediction_id: int,
    baseline_emission: float,
    user_id: int,
) -> CarbonCredit:
    """
    Compute carbon credits for a given prediction.

    reduction       = baseline_emission - predicted_emission
    carbon_credits  = max(0, reduction)
    """
    prediction = db.query(Prediction).filter(
        Prediction.id == prediction_id, Prediction.user_id == user_id
    ).first()
    if not prediction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")

    reduction = baseline_emission - prediction.predicted_emission
    credits = max(0.0, reduction)

    record = CarbonCredit(
        prediction_id=prediction_id,
        baseline_emission=baseline_emission,
        predicted_emission=prediction.predicted_emission,
        reduction=reduction,
        carbon_credits=credits,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    logger.info(f"Carbon credits computed: prediction={prediction_id}, credits={credits:.2f}")
    return record

"""Report persistence and retrieval service."""
from __future__ import annotations

import os

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.carbon_credit import CarbonCredit
from app.models.prediction import Prediction
from app.models.report import Report
from app.models.user import User
from app.services.pdf_service import generate_pdf
from app.utils.constants import AuditActions
from app.utils.logger import get_logger

logger = get_logger("services.report")


def create_report(
    db: Session,
    user_id: int,
    prediction_id: int,
    report_type: str = "general",
    ip_address: str = "unknown",
) -> Report:
    """Generate a PDF for a prediction and persist the Report record."""
    user = db.query(User).filter(User.id == user_id).first()
    prediction = db.query(Prediction).filter(
        Prediction.id == prediction_id, Prediction.user_id == user_id
    ).first()
    if not prediction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")

    credit = db.query(CarbonCredit).filter(CarbonCredit.prediction_id == prediction_id).first()

    report_data = {
        "facility_name": prediction.facility_name,
        "country": prediction.country or "N/A",
        "predicted_emission": prediction.predicted_emission,
        "baseline_emission": prediction.baseline_emission or 0,
        "reduction": credit.reduction if credit else 0,
        "carbon_credits": credit.carbon_credits if credit else 0,
        "user_name": user.name if user else "N/A",
        "generated_at": prediction.created_at.strftime("%Y-%m-%d %H:%M UTC"),
    }

    pdf_path = generate_pdf(report_data=report_data, report_type=report_type)

    report = Report(user_id=user_id, pdf_path=pdf_path, report_type=report_type)
    db.add(report)

    audit = AuditLog(user_id=user_id, action=AuditActions.GENERATE_REPORT, ip_address=ip_address)
    db.add(audit)
    db.commit()
    db.refresh(report)
    return report


def get_user_reports(db: Session, user_id: int, skip: int = 0, limit: int = 20) -> tuple[int, list[Report]]:
    q = db.query(Report).filter(Report.user_id == user_id)
    total = q.count()
    reports = q.order_by(Report.generated_at.desc()).offset(skip).limit(limit).all()
    return total, reports


def get_all_reports(db: Session, skip: int = 0, limit: int = 50) -> tuple[int, list[Report]]:
    q = db.query(Report)
    total = q.count()
    reports = q.order_by(Report.generated_at.desc()).offset(skip).limit(limit).all()
    return total, reports


def get_report_file(db: Session, report_id: int, user_id: int | None = None) -> str:
    """Return the PDF file path; optionally scoped to a user."""
    q = db.query(Report).filter(Report.id == report_id)
    if user_id:
        q = q.filter(Report.user_id == user_id)
    report = q.first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    if not os.path.exists(report.pdf_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PDF file not found on disk")
    return report.pdf_path

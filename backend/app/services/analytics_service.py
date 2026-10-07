"""Analytics aggregation service for dashboard and admin endpoints."""
from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.carbon_credit import CarbonCredit
from app.models.prediction import Prediction
from app.models.report import Report
from app.models.user import User


def get_dashboard_overview(db: Session) -> dict:
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_predictions = db.query(func.count(Prediction.id)).scalar() or 0
    total_emissions = db.query(func.sum(Prediction.predicted_emission)).scalar() or 0.0
    total_credits = db.query(func.sum(CarbonCredit.carbon_credits)).scalar() or 0.0
    return {
        "total_users": total_users,
        "total_predictions": total_predictions,
        "total_emissions": round(total_emissions, 2),
        "total_credits": round(total_credits, 2),
    }


def get_emissions_trend(db: Session) -> list[dict]:
    rows = (
        db.query(
            extract("year", Prediction.created_at).label("year"),
            extract("month", Prediction.created_at).label("month"),
            func.sum(Prediction.predicted_emission).label("total_emissions"),
            func.count(Prediction.id).label("count"),
        )
        .group_by("year", "month")
        .order_by("year", "month")
        .all()
    )
    return [
        {
            "year": int(r.year),
            "month": int(r.month),
            "total_emissions": round(r.total_emissions or 0, 2),
            "count": r.count,
        }
        for r in rows
    ]


def get_credit_trend(db: Session) -> list[dict]:
    rows = (
        db.query(
            extract("year", CarbonCredit.created_at).label("year"),
            extract("month", CarbonCredit.created_at).label("month"),
            func.sum(CarbonCredit.carbon_credits).label("total_credits"),
        )
        .group_by("year", "month")
        .order_by("year", "month")
        .all()
    )
    return [
        {
            "year": int(r.year),
            "month": int(r.month),
            "total_credits": round(r.total_credits or 0, 2),
        }
        for r in rows
    ]


def get_country_analytics(db: Session) -> list[dict]:
    rows = (
        db.query(
            Prediction.country,
            func.sum(Prediction.predicted_emission).label("emissions"),
            func.sum(CarbonCredit.carbon_credits).label("credits"),
        )
        .outerjoin(CarbonCredit, CarbonCredit.prediction_id == Prediction.id)
        .group_by(Prediction.country)
        .order_by(func.sum(Prediction.predicted_emission).desc())
        .all()
    )
    return [
        {
            "country": r.country or "Unknown",
            "emissions": round(r.emissions or 0, 2),
            "credits": round(r.credits or 0, 2),
        }
        for r in rows
    ]


def get_user_growth(db: Session) -> list[dict]:
    rows = (
        db.query(
            extract("year", User.created_at).label("year"),
            extract("month", User.created_at).label("month"),
            func.count(User.id).label("new_users"),
        )
        .group_by("year", "month")
        .order_by("year", "month")
        .all()
    )
    return [{"year": int(r.year), "month": int(r.month), "new_users": r.new_users} for r in rows]


def get_prediction_stats(db: Session) -> dict:
    total = db.query(func.count(Prediction.id)).scalar() or 0
    avg_emission = db.query(func.avg(Prediction.predicted_emission)).scalar() or 0.0
    max_emission = db.query(func.max(Prediction.predicted_emission)).scalar() or 0.0
    min_emission = db.query(func.min(Prediction.predicted_emission)).scalar() or 0.0
    return {
        "total_predictions": total,
        "avg_emission": round(avg_emission, 2),
        "max_emission": round(max_emission, 2),
        "min_emission": round(min_emission, 2),
    }


def get_top_countries(db: Session, limit: int = 10) -> list[dict]:
    rows = (
        db.query(
            Prediction.country,
            func.sum(Prediction.predicted_emission).label("total_emissions"),
        )
        .group_by(Prediction.country)
        .order_by(func.sum(Prediction.predicted_emission).desc())
        .limit(limit)
        .all()
    )
    return [{"country": r.country or "Unknown", "total_emissions": round(r.total_emissions or 0, 2)} for r in rows]


def get_top_facilities(db: Session, limit: int = 10) -> list[dict]:
    rows = (
        db.query(
            Prediction.facility_name,
            func.sum(Prediction.predicted_emission).label("total_emissions"),
        )
        .group_by(Prediction.facility_name)
        .order_by(func.sum(Prediction.predicted_emission).desc())
        .limit(limit)
        .all()
    )
    return [{"facility_name": r.facility_name, "total_emissions": round(r.total_emissions or 0, 2)} for r in rows]


def get_model_metrics(db: Session) -> dict:
    total_calls = db.query(func.count(AuditLog.id)).filter(AuditLog.action == "PREDICT").scalar() or 0
    return {"total_inference_calls": total_calls}


def get_report_stats(db: Session) -> dict:
    total = db.query(func.count(Report.id)).scalar() or 0
    by_type = (
        db.query(Report.report_type, func.count(Report.id).label("count"))
        .group_by(Report.report_type)
        .all()
    )
    return {
        "total_reports": total,
        "by_type": {r.report_type: r.count for r in by_type},
    }

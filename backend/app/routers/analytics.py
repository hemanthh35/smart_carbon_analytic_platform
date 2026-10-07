"""Admin analytics router."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth import get_admin_user
from app.core.database import get_db
from app.models.user import User
from app.services import analytics_service

router = APIRouter(prefix="/api/admin", tags=["Admin Analytics"])


@router.get("/user-growth")
async def user_growth(db: Session = Depends(get_db), _admin: User = Depends(get_admin_user)):
    return analytics_service.get_user_growth(db)


@router.get("/prediction-stats")
async def prediction_stats(db: Session = Depends(get_db), _admin: User = Depends(get_admin_user)):
    return analytics_service.get_prediction_stats(db)


@router.get("/top-countries")
async def top_countries(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    return analytics_service.get_top_countries(db, limit=limit)


@router.get("/top-facilities")
async def top_facilities(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    return analytics_service.get_top_facilities(db, limit=limit)


@router.get("/model-metrics")
async def model_metrics(db: Session = Depends(get_db), _admin: User = Depends(get_admin_user)):
    return analytics_service.get_model_metrics(db)


@router.get("/report-stats")
async def report_stats(db: Session = Depends(get_db), _admin: User = Depends(get_admin_user)):
    return analytics_service.get_report_stats(db)

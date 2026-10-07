"""Dashboard router: overview and trend data."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.services import analytics_service

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/overview")
async def overview(db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    return analytics_service.get_dashboard_overview(db)


@router.get("/emissions-trend")
async def emissions_trend(db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    return analytics_service.get_emissions_trend(db)


@router.get("/credit-trend")
async def credit_trend(db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    return analytics_service.get_credit_trend(db)


@router.get("/countries")
async def countries(db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    return analytics_service.get_country_analytics(db)

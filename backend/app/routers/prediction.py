"""Prediction router: simplified and full feature prediction endpoints."""
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.prediction import Prediction
from app.schemas.prediction import FullPredictionInput, PredictionOut, SimplePredictionInput
from app.services.prediction_service import run_prediction
from app.services.dataset_service import dataset_service
from app.utils.constants import FEATURE_DEFAULTS
from app.utils.helpers import get_client_ip

router = APIRouter(prefix="/api", tags=["Prediction"])


@router.post("/predict", response_model=PredictionOut, status_code=status.HTTP_201_CREATED)
async def predict_simple(
    payload: SimplePredictionInput,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Simplified prediction endpoint — supply operational fields + dropdown metadata.
    Returns predicted emission in original t CO₂ scale.
    """
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
        "activity": payload.activity,
        "capacity": payload.capacity,
        "capacity_factor": payload.capacity_factor,
        "lat": payload.lat,
        "lon": payload.lon,
    })
    return run_prediction(
        db=db,
        user_id=current_user.id,
        features=features,
        facility_name=payload.facility_name,
        country=payload.country,
        baseline_emission=payload.baseline_emission,
        ip_address=get_client_ip(request),
    )


@router.post("/predict/full", response_model=PredictionOut, status_code=status.HTTP_201_CREATED)
async def predict_full(
    payload: FullPredictionInput,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Full-feature prediction — supply all 24 encoded features for best accuracy.
    """
    features = payload.model_dump(exclude={"facility_name", "country", "baseline_emission"})
    return run_prediction(
        db=db,
        user_id=current_user.id,
        features=features,
        facility_name=payload.facility_name,
        country=payload.country,
        baseline_emission=payload.baseline_emission,
        ip_address=get_client_ip(request),
    )


@router.get("/predictions", response_model=list[PredictionOut])
async def list_user_predictions(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List historical predictions for the logged-in user.
    """
    return db.query(Prediction).filter(Prediction.user_id == current_user.id).order_by(Prediction.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/prediction/countries")
async def get_countries(current_user: User = Depends(get_current_user)):
    return dataset_service.get_countries()


@router.get("/prediction/source-types")
async def get_source_types(current_user: User = Depends(get_current_user)):
    return dataset_service.get_source_types()


@router.get("/prediction/sectors")
async def get_sectors(current_user: User = Depends(get_current_user)):
    return dataset_service.get_sectors()


@router.get("/prediction/subsectors")
async def get_subsectors(current_user: User = Depends(get_current_user)):
    return dataset_service.get_subsectors()


@router.get("/prediction/gases")
async def get_gases(current_user: User = Depends(get_current_user)):
    return dataset_service.get_gases()


@router.get("/prediction/facilities")
async def get_facilities(current_user: User = Depends(get_current_user)):
    return dataset_service.get_facilities()


@router.get("/public/stats")
async def get_public_stats(db: Session = Depends(get_db)):
    from sqlalchemy import func
    from app.models.carbon_credit import CarbonCredit
    from app.models.prediction import Prediction
    
    total_facilities = len(dataset_service.get_facilities())
    total_countries = len(dataset_service.get_countries())
    
    # Tracked emissions from dataset: 12.3 Billion tons
    total_emissions_tracked = 12323563120
    
    # Active credits from DB
    total_credits_issued = db.query(func.sum(CarbonCredit.carbon_credits)).scalar() or 0.0
    total_predictions = db.query(func.count(Prediction.id)).scalar() or 0
    
    return {
        "total_facilities": total_facilities,
        "total_countries": total_countries,
        "total_emissions_tracked": total_emissions_tracked,
        "total_credits_issued": total_credits_issued,
        "total_predictions": total_predictions
    }


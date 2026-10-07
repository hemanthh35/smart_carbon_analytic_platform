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
from app.utils.constants import FEATURE_DEFAULTS, CONSTANT_FIELD_LABELS
from app.utils.helpers import get_client_ip

router = APIRouter(prefix="/api", tags=["Prediction"])


@router.get("/prediction/facility/{source_id}/features")
async def get_facility_feature_preview(
    source_id: int,
    current_user: User = Depends(get_current_user),
):
    """
    Full 24-feature preview for a facility, used by the UI to show every value the model
    will actually receive — including the 14 fields that are auto-derived rather than
    typed by the user (facility history + dataset-wide constants).
    """
    history = dataset_service.get_facility_history(source_id)
    used_fallback = history is None
    if history is None:
        # No history on file for this facility — fall back to dataset-wide defaults,
        # clearly flagged so the UI can tell the user these aren't facility-specific.
        history = {k: v for k, v in FEATURE_DEFAULTS.items() if k not in (
            "iso3_country", "source_type", "sector", "subsector", "gas", "activity"
        )}

    return {
        "source_id": source_id,
        "used_facility_history": not used_fallback,
        "derived": {
            "emission_lag_1": history["emission_lag_1"],
            "emission_lag_3": history["emission_lag_3"],
            "emission_lag_6": history["emission_lag_6"],
            "emission_lag_12": history["emission_lag_12"],
            "rolling_mean_3": history["rolling_mean_3"],
            "rolling_mean_6": history["rolling_mean_6"],
            "rolling_mean_12": history["rolling_mean_12"],
            "emissions_factor": history["emissions_factor"],
            "year": history["year"],
            "month": history["month"],
            "quarter": history["quarter"],
        },
        "constants": {
            "gas": CONSTANT_FIELD_LABELS["gas"],
            "activity_units": CONSTANT_FIELD_LABELS["activity_units"],
            "emissions_factor_units": CONSTANT_FIELD_LABELS["emissions_factor_units"],
            "capacity_units": CONSTANT_FIELD_LABELS["capacity_units"],
        },
    }


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
        # The model was trained on 'activity' as a label-encoded category index (0-45205), not raw
        # tonnage — raw tonnage here would overflow the scaler's trained range and blow up the
        # prediction (e.g. "800,000,000,000k"). encode_activity() maps it into the valid range.
        "activity": dataset_service.encode_activity(payload.activity),
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


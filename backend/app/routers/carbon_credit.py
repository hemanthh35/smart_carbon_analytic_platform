"""Carbon credit router."""
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.carbon_credit import CarbonCredit
from app.models.prediction import Prediction
from app.schemas.carbon_credit import CarbonCreditOut, CarbonCreditRequest, CarbonCreditDetailsOut
from app.services.carbon_credit_service import compute_carbon_credits
from app.utils.helpers import get_client_ip

router = APIRouter(prefix="/api", tags=["Carbon Credits"])


@router.post("/carbon-credit", response_model=CarbonCreditOut, status_code=status.HTTP_201_CREATED)
async def create_carbon_credit(
    payload: CarbonCreditRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Compute carbon credits for an existing prediction.
    Formula: reduction = baseline − predicted; carbon_credits = max(0, reduction)
    """
    return compute_carbon_credits(
        db=db,
        prediction_id=payload.prediction_id,
        baseline_emission=payload.baseline_emission,
        user_id=current_user.id,
    )


@router.get("/carbon-credits", response_model=list[CarbonCreditDetailsOut])
async def list_carbon_credits(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List computed carbon credits for the logged-in user.
    """
    return (
        db.query(CarbonCredit)
        .join(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(CarbonCredit.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


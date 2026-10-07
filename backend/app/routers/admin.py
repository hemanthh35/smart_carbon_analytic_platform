"""Admin router: user management and admin-only views."""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.auth import get_admin_user
from app.core.database import get_db
from app.models.audit_log import AuditLog
from app.models.prediction import Prediction
from app.models.report import Report
from app.models.user import User
from app.schemas.user import UserListResponse, UserOut
from app.utils.constants import AuditActions
from app.utils.helpers import get_client_ip

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/users", response_model=UserListResponse)
async def list_users(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    q = db.query(User)
    total = q.count()
    users = q.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return UserListResponse(total=total, users=users)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete yourself")
    db.delete(user)
    db.add(AuditLog(user_id=admin.id, action=AuditActions.DELETE_USER, ip_address=get_client_ip(request)))
    db.commit()


@router.get("/reports")
async def admin_list_reports(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    q = db.query(Report)
    total = q.count()
    reports = q.order_by(Report.generated_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "reports": [
        {"id": r.id, "user_id": r.user_id, "report_type": r.report_type,
         "pdf_path": r.pdf_path, "generated_at": r.generated_at.isoformat()} for r in reports
    ]}


@router.get("/predictions")
async def admin_list_predictions(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    q = db.query(Prediction)
    total = q.count()
    preds = q.order_by(Prediction.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "predictions": [
        {"id": p.id, "user_id": p.user_id, "facility_name": p.facility_name,
         "country": p.country, "predicted_emission": p.predicted_emission,
         "created_at": p.created_at.isoformat()} for p in preds
    ]}


@router.get("/logs")
async def admin_list_logs(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    q = db.query(AuditLog)
    total = q.count()
    logs = q.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return {"total": total, "logs": [
        {"id": l.id, "user_id": l.user_id, "action": l.action,
         "ip_address": l.ip_address, "timestamp": l.timestamp.isoformat(),
         "user_name": l.user.name if l.user else "System"} for l in logs
    ]}

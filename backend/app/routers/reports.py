"""Reports router: generate, list, download PDFs."""
from fastapi import APIRouter, Depends, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.auth import get_admin_user, get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.report import ReportGenerateRequest, ReportListResponse, ReportOut
from app.services.report_service import create_report, get_report_file, get_user_reports
from app.utils.helpers import get_client_ip

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.post("/generate", response_model=ReportOut, status_code=201)
async def generate_report(
    payload: ReportGenerateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = create_report(
        db=db,
        user_id=current_user.id,
        prediction_id=payload.prediction_id,
        report_type=payload.report_type,
        ip_address=get_client_ip(request),
    )
    return ReportOut(
        id=report.id,
        user_id=report.user_id,
        pdf_path=report.pdf_path,
        report_type=report.report_type,
        generated_at=report.generated_at,
        pdf_url=f"/api/reports/{report.id}/download",
    )


@router.get("/", response_model=ReportListResponse)
async def list_reports(
    skip: int = 0, limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total, reports = get_user_reports(db=db, user_id=current_user.id, skip=skip, limit=limit)
    return ReportListResponse(
        total=total,
        reports=[
            ReportOut(
                id=r.id, user_id=r.user_id, pdf_path=r.pdf_path,
                report_type=r.report_type, generated_at=r.generated_at,
                pdf_url=f"/api/reports/{r.id}/download",
            )
            for r in reports
        ],
    )


@router.get("/{report_id}/download")
async def download_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pdf_path = get_report_file(db=db, report_id=report_id, user_id=current_user.id)
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"report_{report_id}.pdf",
    )

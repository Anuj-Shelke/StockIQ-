"""Administrative Dashboard & Operational Telemetry API Endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_admin_user
from app.core.exceptions import DatabaseUnavailableError
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin_review import AdminSystemMetrics
from app.services.data_quality_service import DataQualityService


router = APIRouter()


@router.get("/metrics", response_model=AdminSystemMetrics, summary="Get operational admin telemetry")
def get_admin_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
) -> AdminSystemMetrics:
    """Retrieve system operational metrics: active users, analysis volume, data latency, and ticket counts."""
    try:
        return DataQualityService.get_system_metrics(db=db)
    except Exception as exc:
        db.rollback()
        raise DatabaseUnavailableError() from exc

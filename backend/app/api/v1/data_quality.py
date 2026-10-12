"""Data Quality Audit & Feed Health API Endpoints."""

from typing import List
from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.admin_review import DataQualityReport
from app.services.data_quality_service import DataQualityService


router = APIRouter()


@router.get("/reports", response_model=List[DataQualityReport], summary="List data feed quality audits")
def get_data_quality_reports(
    current_user: User = Depends(get_current_user),
) -> List[DataQualityReport]:
    """Audit market feed health, ingestion latency, and vector database coverage."""
    return DataQualityService.get_quality_reports()

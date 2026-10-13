"""Administrative Review Queue Management API Endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin_review import (
    ReviewRequestItem,
    ReviewSeverity,
    ReviewStatus,
    ReviewUpdatePayload,
)
from app.services.review_service import ReviewService


router = APIRouter()


@router.get("", response_model=List[ReviewRequestItem], summary="List all review queue tickets")
@router.get("/", response_model=List[ReviewRequestItem], summary="List all review queue tickets")
def list_admin_reviews(
    status: Optional[str] = Query(None, description="Filter by status (PENDING, IN_REVIEW, RESOLVED, REJECTED)"),
    severity: Optional[str] = Query(None, description="Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[ReviewRequestItem]:
    """Retrieve all submitted review tickets with optional filtering."""
    return ReviewService.list_review_requests(status=status, severity=severity, db=db)


@router.get("/{ticket_id}", response_model=ReviewRequestItem, summary="Get review ticket detail")
def get_admin_review(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReviewRequestItem:
    """Retrieve full audit details and analysis snapshot data for a specific review ticket."""
    return ReviewService.get_review_request(ticket_id=ticket_id, db=db)


@router.put("/{ticket_id}", response_model=ReviewRequestItem, summary="Update review ticket status")
@router.patch("/{ticket_id}", response_model=ReviewRequestItem, summary="Update review ticket status")
def update_admin_review(
    ticket_id: str,
    payload: ReviewUpdatePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReviewRequestItem:
    """Advance review status to IN_REVIEW, RESOLVED, or REJECTED with compliance notes."""
    reviewer_email = getattr(current_user, "email", "admin@stockiq.example.com")
    return ReviewService.update_review_request(
        ticket_id=ticket_id,
        payload=payload,
        reviewer_email=reviewer_email,
        db=db,
    )

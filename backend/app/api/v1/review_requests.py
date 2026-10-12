"""Review Requests API for Investors (Reporting Disputed Predictions/Analyses)."""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin_review import ReviewRequestCreate, ReviewRequestItem
from app.services.review_service import ReviewService


router = APIRouter()


@router.post("", response_model=ReviewRequestItem, status_code=201, summary="Submit a review request")
@router.post("/", response_model=ReviewRequestItem, status_code=201, summary="Submit a review request")
def submit_review_request(
    request: ReviewRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReviewRequestItem:
    """Submit an analysis discrepancy ticket for review by compliance and quantitative analysts."""
    return ReviewService.create_review_request(
        user_id=str(current_user.id),
        user_email=getattr(current_user, "email", f"{current_user.id}@example.com"),
        request=request,
        db=db,
    )


@router.get("", response_model=List[ReviewRequestItem], summary="List current user's submitted review requests")
@router.get("/", response_model=List[ReviewRequestItem], summary="List current user's submitted review requests")
def list_my_review_requests(
    current_user: User = Depends(get_current_user),
) -> List[ReviewRequestItem]:
    """Retrieve review tickets submitted by the authenticated investor."""
    return ReviewService.list_review_requests(user_id=str(current_user.id))

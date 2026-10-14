"""Persistent user review requests and administrative review workflow."""

from datetime import datetime, timezone
import uuid
from typing import List, Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, DatabaseUnavailableError, NotFoundError
from app.models.review import ReviewRequest
from app.models.user import User
from app.schemas.admin_review import ReviewRequestCreate, ReviewRequestItem, ReviewStatus, ReviewUpdatePayload


class ReviewService:
    @staticmethod
    def _item(row: ReviewRequest, user_name: Optional[str] = None) -> ReviewRequestItem:
        return ReviewRequestItem(
            id=row.id,
            user_id=str(row.user_id) if row.user_id else "",
            user_name=user_name,
            user_email=row.user_email,
            symbol=row.symbol,
            analysis_snapshot_id=row.analysis_snapshot_id,
            reason=row.reason,
            user_notes=row.user_notes,
            status=row.status,
            severity=row.severity,
            created_at=row.created_at,
            updated_at=row.updated_at,
            assigned_reviewer=row.assigned_reviewer,
            reviewer_id=str(row.reviewer_id) if row.reviewer_id else None,
            reviewed_at=row.reviewed_at,
            resolution_notes=row.resolution_notes,
            snapshot_data=row.snapshot_data,
        )

    @classmethod
    def create_review_request(
        cls,
        user_id: str,
        user_email: str,
        request: ReviewRequestCreate,
        db: Session,
    ) -> ReviewRequestItem:
        try:
            active = db.query(ReviewRequest).filter(
                ReviewRequest.user_id == user_id,
                ReviewRequest.analysis_snapshot_id == request.analysis_snapshot_id,
                ReviewRequest.status.in_(("PENDING", "IN_REVIEW")),
            ).first()
        except Exception as exc:
            db.rollback()
            raise DatabaseUnavailableError() from exc
        if active:
            raise ConflictError("A review request is already active for this analysis.")

        row = ReviewRequest(
            id=f"REV-{datetime.now(timezone.utc).year}-{uuid.uuid4().hex[:8].upper()}",
            user_id=user_id,
            user_email=user_email,
            symbol=request.symbol.upper(),
            analysis_snapshot_id=request.analysis_snapshot_id,
            reason=request.reason,
            user_notes=request.user_notes,
            status="PENDING",
            severity=request.severity,
            snapshot_data=request.snapshot_data,
            created_at=datetime.now(timezone.utc),
        )
        try:
            db.add(row)
            db.commit()
            db.refresh(row)
        except IntegrityError as exc:
            db.rollback()
            raise ConflictError("A review request is already active for this analysis.") from exc
        except Exception as exc:
            db.rollback()
            raise DatabaseUnavailableError() from exc
        return cls._item(row)

    @classmethod
    def list_review_requests(
        cls,
        db: Session,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> List[ReviewRequestItem]:
        try:
            query = db.query(ReviewRequest, User.full_name).outerjoin(User, User.id == ReviewRequest.user_id)
            if user_id:
                query = query.filter(ReviewRequest.user_id == user_id)
            if status and status != "ALL":
                query = query.filter(ReviewRequest.status == status)
            if severity and severity != "ALL":
                query = query.filter(ReviewRequest.severity == severity)
            return [cls._item(row, user_name) for row, user_name in query.order_by(ReviewRequest.created_at.desc()).all()]
        except Exception as exc:
            db.rollback()
            raise DatabaseUnavailableError() from exc

    @classmethod
    def get_review_request(cls, ticket_id: str, db: Session) -> ReviewRequestItem:
        try:
            result = db.query(ReviewRequest, User.full_name).outerjoin(
                User, User.id == ReviewRequest.user_id
            ).filter(ReviewRequest.id == ticket_id).first()
        except Exception as exc:
            db.rollback()
            raise DatabaseUnavailableError() from exc
        if not result:
            raise NotFoundError("Review request not found.")
        row, user_name = result
        return cls._item(row, user_name)

    @classmethod
    def update_review_request(
        cls,
        ticket_id: str,
        payload: ReviewUpdatePayload,
        reviewer: User,
        db: Session,
    ) -> ReviewRequestItem:
        try:
            row = db.query(ReviewRequest).filter(ReviewRequest.id == ticket_id).first()
            if not row:
                raise NotFoundError("Review request not found.")
            now = datetime.now(timezone.utc)
            row.status = payload.status
            row.assigned_reviewer = reviewer.email
            row.reviewer_id = reviewer.id
            row.reviewed_at = now
            row.updated_at = now
            if payload.resolution_notes is not None:
                row.resolution_notes = payload.resolution_notes
            db.commit()
            db.refresh(row)
            user_name = db.query(User.full_name).filter(User.id == row.user_id).scalar()
            return cls._item(row, user_name)
        except NotFoundError:
            db.rollback()
            raise
        except Exception as exc:
            db.rollback()
            raise DatabaseUnavailableError() from exc

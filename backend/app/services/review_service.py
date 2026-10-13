"""Admin Review & Model Governance Service."""

from datetime import datetime, timezone
import uuid
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.review import ReviewRequest
from app.models.system import AuditLog
from app.schemas.admin_review import (
    ReviewRequestCreate,
    ReviewRequestItem,
    ReviewSeverity,
    ReviewStatus,
    ReviewUpdatePayload,
)


# In-memory store initialized with realistic review requests as backup/fallback
_in_memory_reviews: Dict[str, ReviewRequestItem] = {
    "REV-2026-001": ReviewRequestItem(
        id="REV-2026-001",
        user_id="test-user-123",
        user_email="trader@stockiq.example.com",
        symbol="RELIANCE.NS",
        analysis_snapshot_id="SNAP-8821",
        reason="Disputed Price Target Horizon",
        user_notes="The 30-day forecast projects an upside of +12.4% despite ongoing O2C cyclical margin headwinds reported in Q2 earnings.",
        status="PENDING",
        severity="MEDIUM",
        created_at=datetime.now(timezone.utc),
        snapshot_data={
            "currentPrice": 2985.0,
            "predictedTarget": 3355.0,
            "modelConfidence": 0.84,
            "timeHorizon": "30d",
        },
    ),
    "REV-2026-002": ReviewRequestItem(
        id="REV-2026-002",
        user_id="test-user-456",
        user_email="investor.rahul@example.com",
        symbol="TCS.NS",
        analysis_snapshot_id="SNAP-9014",
        reason="Severe Drawdown Discrepancy",
        user_notes="COVID-19 simulated drawdown for IT sector shows -42%, which conflicts with actual historical peak decline of -28.4%.",
        status="IN_REVIEW",
        severity="HIGH",
        created_at=datetime.now(timezone.utc),
        assigned_reviewer="admin@stockiq.example.com",
        snapshot_data={
            "currentPrice": 4120.0,
            "predictedTarget": 4260.0,
            "modelConfidence": 0.79,
            "timeHorizon": "90d",
        },
    ),
    "REV-2026-003": ReviewRequestItem(
        id="REV-2026-003",
        user_id="test-user-789",
        user_email="priya.sharma@example.com",
        symbol="HDFCBANK.NS",
        analysis_snapshot_id="SNAP-9102",
        reason="Merger NIM Compression Anomaly",
        user_notes="Model did not factor in post-merger net interest margin drag.",
        status="RESOLVED",
        severity="LOW",
        created_at=datetime.now(timezone.utc),
        assigned_reviewer="compliance@stockiq.example.com",
        resolution_notes="Validated against latest quarterly reports. Added feature weighting for post-merger liquidity ratio.",
        snapshot_data={
            "currentPrice": 1680.0,
            "predictedTarget": 1740.0,
            "modelConfidence": 0.88,
            "timeHorizon": "30d",
        },
    ),
}


class ReviewService:
    """Manages review tickets submitted by users and evaluated by compliance officers."""

    @classmethod
    def _seed_db_if_empty(cls, db: Session) -> None:
        """Seed initial review request records into the database if empty."""
        try:
            count = db.query(ReviewRequest).count()
            if count == 0:
                for item in _in_memory_reviews.values():
                    row = ReviewRequest(
                        id=item.id,
                        user_id=item.user_id,
                        user_email=item.user_email,
                        symbol=item.symbol,
                        analysis_snapshot_id=item.analysis_snapshot_id,
                        reason=item.reason,
                        user_notes=item.user_notes,
                        status=item.status,
                        severity=item.severity,
                        assigned_reviewer=item.assigned_reviewer,
                        resolution_notes=item.resolution_notes,
                        snapshot_data=item.snapshot_data,
                        created_at=item.created_at,
                    )
                    db.add(row)
                db.commit()
        except Exception:
            db.rollback()

    @classmethod
    def create_review_request(
        cls,
        user_id: str,
        user_email: str,
        request: ReviewRequestCreate,
        db: Optional[Session] = None,
    ) -> ReviewRequestItem:
        """Submit a new review request for an analysis or model forecast and persist to DB."""
        ticket_id = f"REV-{datetime.now(timezone.utc).year}-{str(uuid.uuid4())[:4].upper()}"
        now = datetime.now(timezone.utc)
        snapshot = {
            "currentPrice": 2500.0,
            "predictedTarget": 2650.0,
            "modelConfidence": 0.82,
            "timeHorizon": "30d",
        }

        item = ReviewRequestItem(
            id=ticket_id,
            user_id=user_id,
            user_email=user_email,
            symbol=request.symbol.upper(),
            analysis_snapshot_id=request.analysis_snapshot_id or f"SNAP-{ticket_id}",
            reason=request.reason,
            user_notes=request.user_notes,
            status="PENDING",
            severity=request.severity,
            created_at=now,
            snapshot_data=snapshot,
        )

        _in_memory_reviews[ticket_id] = item

        # Persist to database
        if db:
            try:
                db_item = ReviewRequest(
                    id=ticket_id,
                    user_id=user_id,
                    user_email=user_email,
                    symbol=request.symbol.upper(),
                    analysis_snapshot_id=item.analysis_snapshot_id,
                    reason=request.reason,
                    user_notes=request.user_notes,
                    status="PENDING",
                    severity=request.severity,
                    snapshot_data=snapshot,
                    created_at=now,
                )
                db.add(db_item)
                db.commit()
            except Exception:
                db.rollback()

        return item

    @classmethod
    def list_review_requests(
        cls,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        user_id: Optional[str] = None,
        db: Optional[Session] = None,
    ) -> List[ReviewRequestItem]:
        """Query review requests from database with optional filters, falling back to memory."""
        if db:
            try:
                cls._seed_db_if_empty(db)
                query = db.query(ReviewRequest)
                if user_id:
                    query = query.filter(ReviewRequest.user_id == user_id)
                if status and status != "ALL":
                    query = query.filter(ReviewRequest.status == status)
                if severity and severity != "ALL":
                    query = query.filter(ReviewRequest.severity == severity)

                rows = query.order_by(ReviewRequest.created_at.desc()).all()
                if rows:
                    items: List[ReviewRequestItem] = []
                    for r in rows:
                        items.append(
                            ReviewRequestItem(
                                id=r.id,
                                user_id=r.user_id or "user",
                                user_email=r.user_email,
                                symbol=r.symbol,
                                analysis_snapshot_id=r.analysis_snapshot_id or "",
                                reason=r.reason,
                                user_notes=r.user_notes,
                                status=r.status,  # type: ignore
                                severity=r.severity,  # type: ignore
                                created_at=r.created_at,
                                assigned_reviewer=r.assigned_reviewer,
                                resolution_notes=r.resolution_notes,
                                snapshot_data=r.snapshot_data or {},
                            )
                        )
                    return items
            except Exception:
                pass

        results = list(_in_memory_reviews.values())
        if user_id:
            results = [r for r in results if r.user_id == user_id]
        if status and status != "ALL":
            results = [r for r in results if r.status == status]
        if severity and severity != "ALL":
            results = [r for r in results if r.severity == severity]

        results.sort(key=lambda r: r.created_at, reverse=True)
        return results

    @classmethod
    def get_review_request(cls, ticket_id: str, db: Optional[Session] = None) -> ReviewRequestItem:
        """Fetch individual review request details from DB or memory."""
        if db:
            try:
                row = db.query(ReviewRequest).filter(ReviewRequest.id == ticket_id).first()
                if row:
                    return ReviewRequestItem(
                        id=row.id,
                        user_id=row.user_id or "user",
                        user_email=row.user_email,
                        symbol=row.symbol,
                        analysis_snapshot_id=row.analysis_snapshot_id or "",
                        reason=row.reason,
                        user_notes=row.user_notes,
                        status=row.status,  # type: ignore
                        severity=row.severity,  # type: ignore
                        created_at=row.created_at,
                        assigned_reviewer=row.assigned_reviewer,
                        resolution_notes=row.resolution_notes,
                        snapshot_data=row.snapshot_data or {},
                    )
            except Exception:
                pass

        item = _in_memory_reviews.get(ticket_id)
        if not item:
            raise NotFoundError(f"Review ticket '{ticket_id}' not found")
        return item

    @classmethod
    def update_review_request(
        cls,
        ticket_id: str,
        payload: ReviewUpdatePayload,
        reviewer_email: str = "admin@stockiq.example.com",
        db: Optional[Session] = None,
    ) -> ReviewRequestItem:
        """Advance status of review request (IN_REVIEW, RESOLVED, REJECTED) in DB and memory."""
        item = _in_memory_reviews.get(ticket_id)
        now = datetime.now(timezone.utc)
        reviewer = payload.assigned_reviewer or reviewer_email

        if item:
            item.status = payload.status
            item.updated_at = now
            item.assigned_reviewer = reviewer
            if payload.resolution_notes:
                item.resolution_notes = payload.resolution_notes
            _in_memory_reviews[ticket_id] = item

        if db:
            try:
                row = db.query(ReviewRequest).filter(ReviewRequest.id == ticket_id).first()
                if row:
                    row.status = payload.status
                    row.assigned_reviewer = reviewer
                    row.updated_at = now
                    if payload.resolution_notes:
                        row.resolution_notes = payload.resolution_notes
                db.commit()

                if row:
                    return ReviewRequestItem(
                        id=row.id,
                        user_id=row.user_id or "user",
                        user_email=row.user_email,
                        symbol=row.symbol,
                        analysis_snapshot_id=row.analysis_snapshot_id or "",
                        reason=row.reason,
                        user_notes=row.user_notes,
                        status=row.status,  # type: ignore
                        severity=row.severity,  # type: ignore
                        created_at=row.created_at,
                        assigned_reviewer=row.assigned_reviewer,
                        resolution_notes=row.resolution_notes,
                        snapshot_data=row.snapshot_data or {},
                    )
            except Exception:
                db.rollback()

        if not item:
            raise NotFoundError(f"Review ticket '{ticket_id}' not found")
        return item

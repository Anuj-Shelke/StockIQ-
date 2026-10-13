"""SQLAlchemy ORM model for User Review Requests & Model Governance."""

from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, JSON, String, Text
from app.db.base import Base


class ReviewRequest(Base):
    """Review ticket submitted by a user for an analysis, model forecast, or risk calculation."""

    __tablename__ = "review_requests"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(64), nullable=True, index=True)
    user_email = Column(String(255), nullable=False)
    symbol = Column(String(32), nullable=False, index=True)
    analysis_snapshot_id = Column(String(64), nullable=True)
    reason = Column(String(255), nullable=False)
    user_notes = Column(Text, nullable=False)
    status = Column(String(32), default="PENDING", nullable=False, index=True)
    severity = Column(String(32), default="MEDIUM", nullable=False)
    assigned_reviewer = Column(String(255), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    snapshot_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"<ReviewRequest {self.id} {self.symbol} status={self.status}>"

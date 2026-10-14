"""Pydantic schemas for Admin Governance, Review Requests, and System Telemetry."""

from datetime import datetime
import json
from typing import Any, Dict, List, Literal, Optional
from pydantic import Field, field_validator
from app.schemas.common import APIBaseModel

ReviewStatus = Literal["PENDING", "IN_REVIEW", "RESOLVED", "REJECTED"]
ReviewSeverity = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]


class ReviewRequestCreate(APIBaseModel):
    """Payload submitted by user to report a prediction anomaly or disputed analysis."""
    symbol: str = Field(min_length=1, max_length=32)
    analysis_snapshot_id: str = Field(min_length=1, max_length=128)
    reason: str = Field(min_length=3, max_length=255)
    user_notes: str = Field(min_length=5, max_length=2000)
    severity: ReviewSeverity = "MEDIUM"
    snapshot_data: Dict[str, Any]

    @field_validator("snapshot_data")
    @classmethod
    def validate_snapshot_size(cls, value: Dict[str, Any]) -> Dict[str, Any]:
        if len(json.dumps(value, separators=(",", ":"), ensure_ascii=False).encode("utf-8")) > 16_384:
            raise ValueError("Analysis snapshot must be 16 KB or smaller.")
        return value


class ReviewUpdatePayload(APIBaseModel):
    """Payload submitted by admin to advance or resolve a review ticket."""
    status: ReviewStatus
    resolution_notes: Optional[str] = Field(default=None, max_length=4000)


class ReviewRequestItem(APIBaseModel):
    """Review ticket item with audit details."""
    id: str
    user_id: str
    user_email: str
    user_name: Optional[str] = None
    symbol: str
    analysis_snapshot_id: Optional[str] = None
    reason: str
    user_notes: str
    status: ReviewStatus
    severity: ReviewSeverity
    created_at: datetime
    updated_at: Optional[datetime] = None
    assigned_reviewer: Optional[str] = None
    reviewer_id: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    snapshot_data: Optional[Dict] = None


class AdminSystemMetrics(APIBaseModel):
    """High-level operational metrics for administration dashboard."""
    total_users: int
    total_analyses: int
    active_review_requests: int
    data_quality_status: Literal["HEALTHY", "DEGRADED", "OUTAGE"]
    nse_feed_latency_ms: int
    rag_vector_coverage_percent: float


class AdminUserItem(APIBaseModel):
    id: str
    full_name: Optional[str] = None
    email: str
    role: str
    created_at: datetime
    is_active: bool


class AdminUsersResponse(APIBaseModel):
    items: List[AdminUserItem]
    total: int
    limit: int
    offset: int


class DataQualityReport(APIBaseModel):
    """Data feed health and discrepancy audit."""
    feed_name: str
    status: Literal["HEALTHY", "DEGRADED", "OUTAGE"]
    latency_ms: int
    last_sync_timestamp: datetime
    anomalies_detected: int
    notes: str

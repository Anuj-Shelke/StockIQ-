"""Pydantic schemas for Analysis Snapshots and Event Notifications."""

from datetime import datetime
from typing import Dict, List, Literal, Optional
from pydantic import Field
from app.schemas.common import APIBaseModel

RiskLevel = Literal["Conservative", "Moderate", "Aggressive"]
NotificationType = Literal["ALERT", "REVIEW_UPDATE", "MARKET", "SYSTEM"]


class AnalysisSnapshotCreate(APIBaseModel):
    """Payload to create an immutable analysis snapshot."""
    title: str = Field(min_length=3, max_length=150)
    symbol: str
    asset_class: str = "Equity"
    current_price: float = Field(gt=0)
    target_price: float = Field(gt=0)
    projected_return_percent: float
    risk_level: RiskLevel = "Moderate"
    notes: Optional[str] = None
    scenario_stressed: Optional[str] = None
    snapshot_payload: Optional[Dict] = None


class AnalysisSnapshot(APIBaseModel):
    """Immutable analysis snapshot representation."""
    id: str
    user_id: str
    title: str
    symbol: str
    asset_class: str
    current_price: float
    target_price: float
    projected_return_percent: float
    risk_level: RiskLevel
    notes: Optional[str] = None
    scenario_stressed: Optional[str] = None
    snapshot_payload: Optional[Dict] = None
    created_at: datetime


class AppNotification(APIBaseModel):
    """User in-app and email event notification representation."""
    id: str
    user_id: str
    title: str
    message: str
    type: NotificationType
    timestamp: datetime
    is_read: bool = False
    action_url: Optional[str] = None


class NotificationSendRequest(APIBaseModel):
    """Payload to trigger an email or in-app alert notification."""
    recipient_email: str
    subject: str
    title: str
    message: str
    notification_type: NotificationType = "ALERT"
    action_url: Optional[str] = None

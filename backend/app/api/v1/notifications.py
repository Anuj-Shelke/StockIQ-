"""Notification Center & Email Alerts API Endpoints."""

from typing import Dict, List, Optional
from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.snapshot import AppNotification, NotificationSendRequest
from app.services.notification_service import NotificationService


router = APIRouter()


@router.get("", response_model=List[AppNotification], summary="List user notifications")
@router.get("/", response_model=List[AppNotification], summary="List user notifications")
def list_notifications(
    current_user: User = Depends(get_current_user),
) -> List[AppNotification]:
    """Retrieve in-app event notifications for authenticated user."""
    return NotificationService.list_notifications(user_id=str(current_user.id))


@router.post("/send", response_model=AppNotification, summary="Send notification and email alert")
def send_notification(
    request: NotificationSendRequest,
    current_user: User = Depends(get_current_user),
) -> AppNotification:
    """Trigger an alert notification and send email via Resend."""
    return NotificationService.dispatch_notification(
        user_id=str(current_user.id),
        recipient_email=request.recipient_email,
        title=request.title,
        message=request.message,
        notification_type=request.notification_type,
        action_url=request.action_url,
    )


@router.patch("/{notification_id}/read", summary="Mark notification as read")
@router.put("/{notification_id}/read", summary="Mark notification as read")
def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Mark single notification as read."""
    success = NotificationService.mark_as_read(notification_id, str(current_user.id))
    return {"status": "updated", "is_read": success}


@router.post("/read-all", summary="Mark all notifications as read")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Mark all notifications as read for current user."""
    count = NotificationService.mark_all_as_read(user_id=str(current_user.id))
    return {"status": "updated", "marked_read_count": count}

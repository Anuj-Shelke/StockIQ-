"""Event-driven Notification Service (In-App & Email)."""

from datetime import datetime, timezone
import uuid
from typing import Dict, List, Optional
from app.integrations.email.resend_client import ResendClient
from app.schemas.snapshot import AppNotification, NotificationType


# In-memory notifications store initialized with realistic samples
_in_memory_notifications: Dict[str, AppNotification] = {
    "notif-01": AppNotification(
        id="notif-01",
        user_id="test-user-123",
        title="Review Ticket Resolved",
        message="Compliance review for HDFCBANK.NS (REV-2026-003) has been resolved. Adjusted model weights recorded.",
        type="REVIEW_UPDATE",
        timestamp=datetime.now(timezone.utc),
        is_read=False,
        action_url="/dashboard/admin/reviews",
    ),
    "notif-02": AppNotification(
        id="notif-02",
        user_id="test-user-123",
        title="Drawdown Threshold Warning",
        message="Simulated portfolio stress under COVID-19 scenario reaches -31.2%, exceeding 25% threshold.",
        type="ALERT",
        timestamp=datetime.now(timezone.utc),
        is_read=False,
        action_url="/dashboard/risk-check",
    ),
    "notif-03": AppNotification(
        id="notif-03",
        user_id="test-user-123",
        title="Live NIFTY Feed Operational",
        message="Market session opened. Live index feed streaming at 142ms latency.",
        type="SYSTEM",
        timestamp=datetime.now(timezone.utc),
        is_read=True,
    ),
}


class NotificationService:
    """Dispatches in-app alerts and transactional emails via Resend."""

    @classmethod
    def dispatch_notification(
        cls,
        user_id: str,
        recipient_email: str,
        title: str,
        message: str,
        notification_type: NotificationType = "ALERT",
        action_url: Optional[str] = None,
    ) -> AppNotification:
        """Create an in-app notification and trigger an email dispatch."""
        notif_id = f"notif-{str(uuid.uuid4())[:6]}"
        now = datetime.now(timezone.utc)

        notif = AppNotification(
            id=notif_id,
            user_id=user_id,
            title=title,
            message=message,
            type=notification_type,
            timestamp=now,
            is_read=False,
            action_url=action_url,
        )

        _in_memory_notifications[notif_id] = notif

        # Send email via Resend
        html_body = f"""
        <div style="font-family: sans-serif; padding: 20px; background: #0b0f19; color: #f8fafc; border-radius: 8px;">
            <h2 style="color: #fbbf24;">StockIQ Notification: {title}</h2>
            <p style="font-size: 14px; line-height: 1.6;">{message}</p>
            {f'<a href="{action_url}" style="display: inline-block; margin-top: 15px; padding: 10px 18px; background: #fbbf24; color: #0b0f19; text-decoration: none; font-weight: bold; border-radius: 6px;">View Details</a>' if action_url else ''}
            <hr style="border: 0; border-top: 1px solid #1e293b; margin-top: 25px;" />
            <small style="color: #94a3b8;">Automated notification from StockIQ AI Financial Intelligence.</small>
        </div>
        """
        ResendClient.send_email(
            to_email=recipient_email,
            subject=f"[StockIQ Alert] {title}",
            html_content=html_body,
        )

        return notif

    @classmethod
    def list_notifications(cls, user_id: Optional[str] = None) -> List[AppNotification]:
        """Fetch notifications sorted by timestamp descending."""
        items = list(_in_memory_notifications.values())
        if user_id:
            items = [n for n in items if n.user_id == user_id]
        items.sort(key=lambda n: n.timestamp, reverse=True)
        return items

    @classmethod
    def mark_as_read(cls, notification_id: str) -> bool:
        """Mark individual notification as read."""
        if notification_id in _in_memory_notifications:
            _in_memory_notifications[notification_id].is_read = True
            return True
        return False

    @classmethod
    def mark_all_as_read(cls, user_id: Optional[str] = None) -> int:
        """Mark all notifications as read for user."""
        count = 0
        for n in _in_memory_notifications.values():
            if user_id is None or n.user_id == user_id:
                if not n.is_read:
                    n.is_read = True
                    count += 1
        return count

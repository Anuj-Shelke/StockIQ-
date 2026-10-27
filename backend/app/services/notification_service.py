"""Event-driven Notification Service (In-App & Email)."""

from datetime import datetime, timezone
from html import escape
import logging
import uuid
from typing import Dict, List, Optional
from app.integrations.email.resend_client import ResendClient
from app.schemas.snapshot import AppNotification, NotificationType
from app.core.config import settings
from app.schemas.admin_review import ReviewRequestItem

logger = logging.getLogger(__name__)


# Notifications are created only by real user-scoped events.
_in_memory_notifications: Dict[str, AppNotification] = {}


class NotificationService:
    """Dispatches in-app alerts and transactional emails via Resend."""

    @classmethod
    def send_welcome_email(cls, recipient: str, name: Optional[str]) -> None:
        display_name = escape(name or "there")
        result = ResendClient.send_email(
            to_email=recipient,
            subject="Welcome to StockIQ",
            html_content=(
                f"<h2>Welcome to StockIQ, {display_name}!</h2>"
                "<p>Your account is ready. Explore market insights, track your portfolio, "
                "and make more informed investment decisions with StockIQ.</p>"
                "<p>We’re glad you’re here.</p><p>— The StockIQ Team</p>"
            ),
        )
        logger.info("Welcome email status=%s", result.get("status", "failed"))

    @classmethod
    def notify_admin_review_request(cls, review: ReviewRequestItem) -> None:
        """Best-effort admin notification invoked after a review row has committed."""
        recipient = settings.ADMIN_NOTIFY_EMAIL or settings.ADMIN_EMAIL
        if not recipient:
            logger.info("Review notification email status=mock_skipped review_id=%s", review.id)
            return
        try:
            result = ResendClient.send_email(
                to_email=recipient,
                subject=f"StockIQ expert review requested: {review.symbol}",
                html_content=(
                    "<h2>Expert review requested</h2>"
                    f"<p>Request: {escape(review.id)}</p>"
                    f"<p>Analysis: {escape(review.analysis_snapshot_id or '')}</p>"
                    f"<p>Symbol: {escape(review.symbol)}</p>"
                    f"<p>Reason: {escape(review.reason)}</p>"
                ),
            )
            logger.info("Review notification email status=%s review_id=%s", result.get("status", "failed"), review.id)
        except Exception as exc:
            logger.warning("Review notification email status=failed review_id=%s error=%s", review.id, type(exc).__name__)

    @classmethod
    def notify_review_satisfied(cls, review: ReviewRequestItem) -> None:
        """Tell the requester when an administrator resolves their review."""
        try:
            result = ResendClient.send_email(
                to_email=review.user_email,
                subject=f"StockIQ review completed: {review.symbol}",
                html_content=(
                    f"<h2>Your StockIQ review is complete</h2><p>Request: {escape(review.id)}</p>"
                    f"<p>Our team reviewed your request about {escape(review.symbol)}.</p>"
                    f"<p>Resolution: {escape(review.resolution_notes or 'Your request has been reviewed.')}</p>"
                ),
            )
            logger.info("Review completion email status=%s review_id=%s", result.get("status", "failed"), review.id)
        except Exception as exc:
            logger.warning("Review completion email status=failed review_id=%s error=%s", review.id, type(exc).__name__)

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
    def mark_as_read(cls, notification_id: str, user_id: str) -> bool:
        """Mark individual notification as read."""
        if notification_id in _in_memory_notifications:
            notification = _in_memory_notifications[notification_id]
            if notification.user_id == user_id:
                notification.is_read = True
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

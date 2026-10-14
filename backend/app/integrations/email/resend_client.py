"""Resend API and transactional email notification client."""

import logging
from typing import Dict
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


class ResendClient:
    """Dispatches transactional compliance and risk alert emails via Resend."""

    RESEND_ENDPOINT = "https://api.resend.com/emails"

    @classmethod
    def send_email(
        cls,
        to_email: str,
        subject: str,
        html_content: str,
        from_email: str | None = None,
    ) -> Dict:
        """Send email through Resend; report skipped, failed, and sent distinctly."""
        if settings.TESTING:
            return {"status": "mock_skipped"}
        api_key = settings.RESEND_API_KEY
        if not api_key:
            return {"status": "mock_skipped"}
        if not api_key.startswith("re_"):
            logger.warning("Resend notification failed: configured API key has an invalid format")
            return {"status": "failed"}

        sender = from_email or settings.FROM_EMAIL
        if "@resend.dev" in sender:
            logger.warning("Resend test sender is active; delivery is limited to the Resend account owner")
        try:
            resp = httpx.post(
                cls.RESEND_ENDPOINT,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"from": sender, "to": [to_email], "subject": subject, "html": html_content},
                timeout=5.0,
            )
            if resp.status_code in (200, 201):
                return {"status": "sent", "resend_id": resp.json().get("id")}
            logger.warning("Resend notification failed with HTTP status %s", resp.status_code)
        except Exception as exc:
            logger.warning("Resend notification failed (%s)", type(exc).__name__)
        return {"status": "failed"}

"""Resend API and transactional email notification client."""

import logging
import os
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

        raw_key = (
            settings.RESEND_API_KEY
            or settings.EMAIL_API_KEY
            or os.environ.get("RESEND_API_KEY")
            or os.environ.get("EMAIL_API_KEY")
            or os.environ.get("RESEND_KEY")
            or ""
        )
        api_key = raw_key.strip().strip('"').strip("'")
        if not api_key:
            logger.info("Resend notification skipped: no API key configured.")
            return {"status": "mock_skipped"}
        if not api_key.startswith("re_"):
            logger.warning("Resend notification failed: configured API key has an invalid format")
            return {"status": "failed"}

        sender = from_email or settings.FROM_EMAIL
        if "@resend.dev" in sender:
            logger.info("Resend test sender (%s) active; delivery is limited to the Resend account owner", sender)
        try:
            resp = httpx.post(
                cls.RESEND_ENDPOINT,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"from": sender, "to": [to_email], "subject": subject, "html": html_content},
                timeout=10.0,
            )
            if resp.status_code in (200, 201):
                res_json = resp.json()
                logger.info("Resend notification dispatched successfully (id=%s) to %s", res_json.get("id"), to_email)
                return {"status": "sent", "resend_id": res_json.get("id")}
            logger.warning("Resend notification failed with HTTP status %s: %s", resp.status_code, resp.text)
        except Exception as exc:
            logger.warning("Resend notification failed (%s: %s)", type(exc).__name__, exc)
        return {"status": "failed"}

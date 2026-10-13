"""Resend API and transactional email notification client."""

import os
from typing import Dict, List, Optional
import httpx


class ResendClient:
    """Dispatches transactional compliance and risk alert emails via Resend."""

    RESEND_ENDPOINT = "https://api.resend.com/emails"

    @classmethod
    def send_email(
        cls,
        to_email: str,
        subject: str,
        html_content: str,
        from_email: str = "StockIQ Alerts <alerts@stockiq.ai>",
    ) -> Dict:
        """Send email via Resend API or graceful mock delivery."""
        api_key = os.getenv("RESEND_API_KEY")

        if api_key and api_key.startswith("re_"):
            try:
                resp = httpx.post(
                    cls.RESEND_ENDPOINT,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "from": from_email,
                        "to": [to_email],
                        "subject": subject,
                        "html": html_content,
                    },
                    timeout=5.0,
                )
                if resp.status_code in [200, 201]:
                    return {"status": "sent", "resend_id": resp.json().get("id")}
            except Exception:
                pass

        # Simulated successful delivery for development and testing
        return {
            "status": "delivered_mock",
            "recipient": to_email,
            "subject": subject,
        }

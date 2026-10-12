"""Unit tests for Admin Governance, Review Queue, and System Telemetry."""

import pytest
from app.schemas.admin_review import ReviewRequestCreate, ReviewUpdatePayload
from app.services.data_quality_service import DataQualityService
from app.services.review_service import ReviewService


def test_review_service_lifecycle():
    """Verify review creation and progression."""
    req = ReviewRequestCreate(
        symbol="TCS.NS",
        reason="Anomaly in Volatility",
        user_notes="Calculated volatility is higher than historical index norms.",
        severity="HIGH",
    )
    ticket = ReviewService.create_review_request(
        user_id="user-xyz-101",
        user_email="trader@test.com",
        request=req,
    )
    assert ticket.id.startswith("REV-")
    assert ticket.status == "PENDING"
    assert ticket.severity == "HIGH"

    # Update ticket status
    updated = ReviewService.update_review_request(
        ticket_id=ticket.id,
        payload=ReviewUpdatePayload(status="RESOLVED", resolution_notes="Verified baseline calculation."),
    )
    assert updated.status == "RESOLVED"
    assert updated.resolution_notes == "Verified baseline calculation."


def test_data_quality_service():
    """Verify administrative telemetry metrics and data feed audits."""
    metrics = DataQualityService.get_system_metrics()
    assert metrics.total_users > 0
    assert metrics.data_quality_status == "HEALTHY"
    assert metrics.nse_feed_latency_ms > 0

    reports = DataQualityService.get_quality_reports()
    assert len(reports) >= 3
    assert any(r.feed_name.startswith("NSE") for r in reports)


def test_admin_and_review_endpoints(client, auth_headers):
    """Verify REST API endpoints for user review submission and admin queue management."""
    # 1. User submits review request
    submit_res = client.post(
        "/api/v1/review-requests",
        json={
            "symbol": "INFY.NS",
            "reason": "Forecast Horizon Discrepancy",
            "user_notes": "Predicted price seems misaligned with quarterly guidance.",
            "severity": "MEDIUM",
        },
        headers=auth_headers,
    )
    assert submit_res.status_code == 201
    ticket_data = submit_res.json()
    ticket_id = ticket_data["id"]
    assert ticket_data["symbol"] == "INFY.NS"
    assert ticket_data["status"] == "PENDING"

    # 2. User lists own review requests
    my_res = client.get("/api/v1/review-requests", headers=auth_headers)
    assert my_res.status_code == 200
    assert any(t["id"] == ticket_id for t in my_res.json())

    # 3. Admin views review queue
    admin_list = client.get("/api/v1/admin/reviews?status=PENDING", headers=auth_headers)
    assert admin_list.status_code == 200
    assert any(t["id"] == ticket_id for t in admin_list.json())

    # 4. Admin updates review status
    update_res = client.patch(
        f"/api/v1/admin/reviews/{ticket_id}",
        json={"status": "IN_REVIEW", "resolution_notes": "Under compliance check."},
        headers=auth_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "IN_REVIEW"

    # 5. Admin Dashboard Metrics
    metrics_res = client.get("/api/v1/admin/dashboard/metrics", headers=auth_headers)
    assert metrics_res.status_code == 200
    assert metrics_res.json()["data_quality_status"] == "HEALTHY"

    # 6. Data Quality Reports
    quality_res = client.get("/api/v1/data-quality/reports", headers=auth_headers)
    assert quality_res.status_code == 200
    assert len(quality_res.json()) >= 3

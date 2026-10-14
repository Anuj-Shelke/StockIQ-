"""Unit tests for Admin Governance, Review Queue, and System Telemetry."""

import pytest
import uuid
from app.models.user import User
from app.schemas.admin_review import ReviewRequestCreate, ReviewUpdatePayload
from app.services.data_quality_service import DataQualityService
from app.services.review_service import ReviewService


def test_review_service_lifecycle(db_session):
    """Verify review creation and progression."""
    req = ReviewRequestCreate(
        symbol="TCS.NS",
        reason="Anomaly in Volatility",
        user_notes="Calculated volatility is higher than historical index norms.",
        severity="HIGH",
        analysis_snapshot_id="analysis-lifecycle-1",
        snapshot_data={"source": "test"},
    )
    ticket = ReviewService.create_review_request(
        user_id=str(uuid.uuid4()),
        user_email="trader@test.com",
        request=req,
        db=db_session,
    )
    assert ticket.id.startswith("REV-")
    assert ticket.status == "PENDING"
    assert ticket.severity == "HIGH"

    # Update ticket status
    updated = ReviewService.update_review_request(
        ticket_id=ticket.id,
        payload=ReviewUpdatePayload(status="RESOLVED", resolution_notes="Verified baseline calculation."),
        reviewer=User(id=uuid.uuid4(), email="admin@test.com", password_hash="x", role="admin", is_active=True),
        db=db_session,
    )
    assert updated.status == "RESOLVED"
    assert updated.resolution_notes == "Verified baseline calculation."


def test_data_quality_service(db_session):
    """Verify administrative telemetry metrics and data feed audits."""
    metrics = DataQualityService.get_system_metrics(db_session)
    assert metrics.total_users >= 0
    assert metrics.data_quality_status == "DEGRADED"
    assert metrics.nse_feed_latency_ms == 0

    reports = DataQualityService.get_quality_reports()
    assert len(reports) >= 3
    assert any(r.feed_name.startswith("NSE") for r in reports)


def test_admin_and_review_endpoints(client, auth_headers, admin_auth_headers):
    """Verify REST API endpoints for user review submission and admin queue management."""
    # 1. User submits review request
    submit_res = client.post(
        "/api/v1/review-requests",
        json={
            "symbol": "INFY.NS",
            "reason": "Forecast Horizon Discrepancy",
            "user_notes": "Predicted price seems misaligned with quarterly guidance.",
            "severity": "MEDIUM",
            "analysis_snapshot_id": "analysis-review-endpoint-1",
            "snapshot_data": {"symbol": "INFY.NS", "current_price": 1200},
        },
        headers=auth_headers,
    )
    assert submit_res.status_code == 201
    ticket_data = submit_res.json()
    ticket_id = ticket_data["id"]
    assert ticket_data["symbol"] == "INFY.NS"
    assert ticket_data["status"] == "PENDING"
    duplicate = client.post("/api/v1/review-requests", json={
        "symbol": "INFY.NS", "reason": "Another clarification", "user_notes": "Duplicate active request.",
        "severity": "MEDIUM", "analysis_snapshot_id": "analysis-review-endpoint-1",
        "snapshot_data": {"symbol": "INFY.NS", "current_price": 1200},
    }, headers=auth_headers)
    assert duplicate.status_code == 409

    # 2. User lists own review requests
    my_res = client.get("/api/v1/review-requests", headers=auth_headers)
    assert my_res.status_code == 200
    assert any(t["id"] == ticket_id for t in my_res.json())

    # 3. Admin views review queue
    denied = client.get("/api/v1/admin/reviews?status=PENDING", headers=auth_headers)
    assert denied.status_code == 403
    assert client.get("/api/v1/admin/dashboard/metrics", headers=auth_headers).status_code == 403
    assert client.get("/api/v1/admin/users", headers=auth_headers).status_code == 403
    current_user = client.get("/api/v1/users/me", headers=auth_headers).json()
    visible_users = client.get("/api/v1/admin/users?limit=100", headers=admin_auth_headers).json()
    assert any(user["id"] == current_user["id"] for user in visible_users["items"])
    admin_list = client.get("/api/v1/admin/reviews?status=PENDING", headers=admin_auth_headers)
    assert admin_list.status_code == 200
    assert any(t["id"] == ticket_id for t in admin_list.json())

    # 4. Admin updates review status
    update_res = client.patch(
        f"/api/v1/admin/reviews/{ticket_id}",
        json={"status": "IN_REVIEW", "resolution_notes": "Under compliance check."},
        headers=admin_auth_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "IN_REVIEW"
    assert update_res.json()["reviewer_id"]
    assert update_res.json()["reviewed_at"]
    assert client.get("/api/v1/admin/users?limit=1", headers=admin_auth_headers).json()["limit"] == 1
    user_review = client.get("/api/v1/review-requests", headers=auth_headers).json()
    updated_user_review = next(item for item in user_review if item["id"] == ticket_id)
    assert updated_user_review["status"] == "IN_REVIEW"
    assert updated_user_review["resolution_notes"] == "Under compliance check."

    # 5. Admin Dashboard Metrics
    metrics_res = client.get("/api/v1/admin/dashboard/metrics", headers=admin_auth_headers)
    assert metrics_res.status_code == 200
    assert metrics_res.json()["data_quality_status"] == "DEGRADED"

    # 6. Data Quality Reports
    quality_res = client.get("/api/v1/data-quality/reports", headers=admin_auth_headers)
    assert quality_res.status_code == 200
    assert len(quality_res.json()) >= 3


def test_review_service_db_persistence(db_session):
    """Verify review requests are persisted to database tables and queryable via ORM."""
    from app.models.review import ReviewRequest

    req = ReviewRequestCreate(
        symbol="WIPRO.NS",
        reason="Model Target Divergence",
        user_notes="Investigating variance in predicted opening price.",
        severity="MEDIUM",
        analysis_snapshot_id="analysis-db-persist-1",
        snapshot_data={"source": "test"},
    )
    ticket = ReviewService.create_review_request(
        user_id=str(uuid.uuid4()),
        user_email="investor.db@stockiq.ai",
        request=req,
        db=db_session,
    )
    assert ticket.id.startswith("REV-")

    # Assert record exists in database
    row = db_session.query(ReviewRequest).filter(ReviewRequest.id == ticket.id).first()
    assert row is not None
    assert row.symbol == "WIPRO.NS"
    assert row.user_email == "investor.db@stockiq.ai"
    assert row.status == "PENDING"

    # Advance status in DB
    updated = ReviewService.update_review_request(
        ticket_id=ticket.id,
        payload=ReviewUpdatePayload(status="IN_REVIEW", resolution_notes="Assigned auditor for deep dive."),
        reviewer=User(id=uuid.uuid4(), email="compliance@stockiq.ai", password_hash="x", role="admin", is_active=True),
        db=db_session,
    )
    assert updated.status == "IN_REVIEW"

    # Query DB row to ensure update committed
    row_updated = db_session.query(ReviewRequest).filter(ReviewRequest.id == ticket.id).first()
    assert row_updated.status == "IN_REVIEW"
    assert row_updated.resolution_notes == "Assigned auditor for deep dive."

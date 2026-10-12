"""Unit tests for Analysis Snapshots and Event Notification Services."""

import pytest
from app.schemas.snapshot import AnalysisSnapshotCreate
from app.services.notification_service import NotificationService
from app.services.snapshot_service import SnapshotService


def test_snapshot_service_crud_and_diff():
    """Verify snapshot creation, retrieval, and diffing."""
    req = AnalysisSnapshotCreate(
        title="Infosys AI Margin Expansion",
        symbol="INFY.NS",
        asset_class="Equity (IT)",
        current_price=1890.0,
        target_price=2040.0,
        projected_return_percent=7.94,
        risk_level="Moderate",
    )
    snp = SnapshotService.create_snapshot(user_id="user-xyz-101", request=req)
    assert snp.id.startswith("snp-")
    assert snp.symbol == "INFY.NS"

    # Compare with pre-seeded snapshot
    comparison = SnapshotService.compare_snapshots(id_a=snp.id, id_b="snp-109")
    assert "target_price_delta" in comparison
    assert "projected_return_delta" in comparison
    assert len(comparison["comparison_summary"]) > 10

    # Delete
    deleted = SnapshotService.delete_snapshot(snp.id)
    assert deleted is True


def test_notification_service():
    """Verify in-app alerts and email dispatcher."""
    notif = NotificationService.dispatch_notification(
        user_id="test-user-123",
        recipient_email="test@example.com",
        title="Review Ticket Approved",
        message="Model override approved for RELIANCE.NS",
        notification_type="REVIEW_UPDATE",
    )
    assert notif.id.startswith("notif-")
    assert notif.is_read is False

    # Mark as read
    res = NotificationService.mark_as_read(notif.id)
    assert res is True
    assert notif.is_read is True


def test_snapshots_and_notifications_endpoints(client, auth_headers):
    """Verify REST API endpoints for snapshots and notification center."""
    # 1. Create snapshot
    create_res = client.post(
        "/api/v1/snapshots",
        json={
            "title": "ICICI Bank Loan Book Growth",
            "symbol": "ICICIBANK.NS",
            "asset_class": "Equity (Banking)",
            "current_price": 1260.0,
            "target_price": 1380.0,
            "projected_return_percent": 9.52,
            "risk_level": "Conservative",
        },
        headers=auth_headers,
    )
    assert create_res.status_code == 201
    snp_data = create_res.json()
    snp_id = snp_data["id"]

    # 2. List snapshots
    list_res = client.get("/api/v1/snapshots", headers=auth_headers)
    assert list_res.status_code == 200
    assert any(s["id"] == snp_id for s in list_res.json())

    # 3. Compare snapshots
    cmp_res = client.get(f"/api/v1/snapshots/compare?id_a={snp_id}&id_b=snp-109", headers=auth_headers)
    assert cmp_res.status_code == 200
    assert "comparison_summary" in cmp_res.json()

    # 4. Get individual snapshot
    get_res = client.get(f"/api/v1/snapshots/{snp_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["symbol"] == "ICICIBANK.NS"

    # 5. List notifications
    notif_list = client.get("/api/v1/notifications", headers=auth_headers)
    assert notif_list.status_code == 200
    assert len(notif_list.json()) >= 2

    # 6. Send alert notification
    send_res = client.post(
        "/api/v1/notifications/send",
        json={
            "recipient_email": "trader@example.com",
            "subject": "Drawdown Alert",
            "title": "Severe Drawdown Reached",
            "message": "Portfolio drawdown exceeded risk tolerance limit.",
            "notification_type": "ALERT",
        },
        headers=auth_headers,
    )
    assert send_res.status_code == 200
    new_notif_id = send_res.json()["id"]

    # 7. Mark read and read-all
    read_res = client.patch(f"/api/v1/notifications/{new_notif_id}/read", headers=auth_headers)
    assert read_res.status_code == 200
    assert read_res.json()["is_read"] is True

    all_read = client.post("/api/v1/notifications/read-all", headers=auth_headers)
    assert all_read.status_code == 200

    # 8. Delete snapshot
    del_res = client.delete(f"/api/v1/snapshots/{snp_id}", headers=auth_headers)
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "deleted"

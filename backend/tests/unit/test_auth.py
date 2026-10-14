import uuid
from unittest.mock import Mock, patch
from app.core.security import get_password_hash
from app.core.config import settings
from app.models.user import User


def test_auth_registration_and_login_flow(client):
    unique_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "email": unique_email,
        "password": "StrongPassword123!",
        "full_name": "Test User",
    }

    # Register
    reg_response = client.post("/api/v1/auth/register", json=payload)
    assert reg_response.status_code == 201
    data = reg_response.json()
    assert data["email"] == unique_email
    assert data["role"] == "investor"
    assert "tokens" in data
    assert "access_token" in data["tokens"]
    assert "refresh_token" in data["tokens"]

    refresh_token = data["tokens"]["refresh_token"]

    # Duplicate registration should return 409 Conflict
    dup_response = client.post("/api/v1/auth/register", json=payload)
    assert dup_response.status_code == 409
    dup_data = dup_response.json()
    assert dup_data["success"] is False
    assert dup_data["error"]["code"] == "CONFLICT"

    # Login
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": unique_email, "password": "StrongPassword123!", "portal": "user"},
    )
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert login_data["email"] == unique_email
    assert "access_token" in login_data["tokens"]

    # Refresh token
    refresh_response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_response.status_code == 200
    refreshed_data = refresh_response.json()
    assert "access_token" in refreshed_data
    assert "refresh_token" in refreshed_data


def test_login_invalid_password(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@example.com", "password": "WrongPassword!"},
    )
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "UNAUTHORIZED"


def test_registration_validation_error(client):
    # Password too short (< 8 chars)
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "bad_pass@example.com", "password": "short"},
    )
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert len(data["error"]["details"]) > 0


def test_selected_portal_must_match_database_role(client, db_session):
    investor_email = f"role_{uuid.uuid4().hex[:8]}@example.com"
    investor = User(
        id=uuid.uuid4(), email=investor_email, password_hash=get_password_hash("ValidPass123"),
        role="investor", is_active=True,
    )
    admin = User(
        id=uuid.uuid4(), email=f"admin_{uuid.uuid4().hex[:8]}@example.com",
        password_hash=get_password_hash("admin@1234"), role="admin", is_active=True,
    )
    db_session.add_all([investor, admin])
    db_session.commit()

    wrong_role = client.post("/api/v1/auth/login", json={
        "email": investor.email, "password": "ValidPass123", "portal": "admin",
    })
    assert wrong_role.status_code == 403
    assert wrong_role.json()["error"]["message"] == "These credentials do not have administrator access."

    admin_wrong_portal = client.post("/api/v1/auth/login", json={
        "email": admin.email, "password": "admin@1234", "portal": "user",
    })
    assert admin_wrong_portal.status_code == 403
    assert admin_wrong_portal.json()["error"]["message"] == "This is an administrator account. Please continue as Admin."

    bad_password = client.post("/api/v1/auth/login", json={
        "email": investor.email, "password": "wrong", "portal": "admin",
    })
    assert bad_password.status_code == 401
    assert bad_password.json()["error"]["message"] == "Invalid email or password."

    successful = client.post("/api/v1/auth/login", json={
        "email": admin.email, "password": "admin@1234", "portal": "admin",
    })
    assert successful.status_code == 200


def _google_response(payload, status_code=200):
    response = Mock(status_code=status_code)
    response.json.return_value = payload
    return response


def test_google_signin_links_existing_password_account_and_uses_stockiq_session(client, db_session, monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "stockiq-test-client")
    email = f"google_{uuid.uuid4().hex[:8]}@example.com"
    existing = User(
        id=uuid.uuid4(), email=email, password_hash=get_password_hash("ExistingPass123"),
        role="investor", is_active=True,
    )
    db_session.add(existing)
    db_session.commit()
    original_hash = existing.password_hash
    with patch("httpx.get", side_effect=[
        _google_response({"aud": "stockiq-test-client", "azp": "stockiq-test-client"}),
        _google_response({"email": email, "email_verified": True, "name": "Google Investor"}),
    ]):
        response = client.post("/api/v1/auth/google", json={"access_token": "mock-access-token"})

    assert response.status_code == 200
    assert response.json()["user_id"] == str(existing.id)
    assert response.json()["role"] == "investor"
    assert existing.password_hash == original_hash
    me = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {response.json()['tokens']['access_token']}"})
    assert me.status_code == 200
    assert me.json()["email"] == email


def test_google_signin_creates_only_an_investor(client, db_session, monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "stockiq-test-client")
    email = f"google_new_{uuid.uuid4().hex[:8]}@example.com"
    with patch("httpx.get", side_effect=[
        _google_response({"aud": "stockiq-test-client", "azp": "stockiq-test-client"}),
        _google_response({"email": email, "email_verified": True, "name": "New Investor"}),
    ]):
        response = client.post("/api/v1/auth/google", json={"access_token": "mock-access-token"})

    assert response.status_code == 200
    user = db_session.query(User).filter(User.email == email).one()
    assert user.role == "investor"
    assert response.json()["role"] == "investor"


def test_google_signin_never_authenticates_existing_admin(client, db_session, monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "stockiq-test-client")
    email = f"admin_google_{uuid.uuid4().hex[:8]}@example.com"
    admin = User(
        id=uuid.uuid4(), email=email, password_hash=get_password_hash("AdminPass123"),
        role="admin", is_active=True,
    )
    db_session.add(admin)
    db_session.commit()
    with patch("httpx.get", side_effect=[
        _google_response({"aud": "stockiq-test-client", "azp": "stockiq-test-client"}),
        _google_response({"email": email, "email_verified": True, "name": "Admin"}),
    ]):
        response = client.post("/api/v1/auth/google", json={"access_token": "mock-access-token"})

    assert response.status_code == 403
    assert response.json()["error"]["message"] == "Administrator accounts must sign in with their admin password."


def test_google_signin_rejects_unverified_email(client, monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "stockiq-test-client")
    with patch("httpx.get", side_effect=[
        _google_response({"aud": "stockiq-test-client", "azp": "stockiq-test-client"}),
        _google_response({"email": "unverified@example.com", "email_verified": False}),
    ]):
        response = client.post("/api/v1/auth/google", json={"access_token": "mock-access-token"})

    assert response.status_code == 401


def test_google_signin_rejects_wrong_client_audience(client, monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "stockiq-test-client")
    with patch("httpx.get", return_value=_google_response({"aud": "another-client"})):
        response = client.post("/api/v1/auth/google", json={"access_token": "mock-access-token"})

    assert response.status_code == 401


def test_google_signin_without_configuration_fails_closed(client, monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", None)
    response = client.post("/api/v1/auth/google", json={"access_token": "mock-access-token"})

    assert response.status_code == 503

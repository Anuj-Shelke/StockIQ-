import uuid


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
        json={"email": unique_email, "password": "StrongPassword123!"},
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

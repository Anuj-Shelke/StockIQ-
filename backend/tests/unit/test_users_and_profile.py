def test_get_users_me_unauthorized(client):
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "UNAUTHORIZED"


def test_get_users_me_authorized(client, auth_headers):
    response = client.get("/api/v1/users/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "test-user-123"
    assert data["email"] == "test@stockiq.example.com"
    assert data["role"] == "investor"


def test_patch_users_me(client, auth_headers):
    response = client.patch(
        "/api/v1/users/me",
        json={"full_name": "Updated Name"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Name"


def test_get_and_put_profile(client, auth_headers):
    # GET profile
    get_res = client.get("/api/v1/profile", headers=auth_headers)
    assert get_res.status_code == 200
    profile = get_res.json()
    assert "risk_tolerance" in profile
    assert profile["user_id"] == "test-user-123"

    # PUT profile
    put_res = client.put(
        "/api/v1/profile",
        json={
            "risk_tolerance": "aggressive",
            "investment_horizon_years": 10,
            "monthly_investment": 25000.0,
            "goals": "High growth tech investments",
        },
        headers=auth_headers,
    )
    assert put_res.status_code == 200
    updated_profile = put_res.json()
    assert updated_profile["risk_tolerance"] == "aggressive"
    assert updated_profile["investment_horizon_years"] == 10
    assert updated_profile["monthly_investment"] == 25000.0

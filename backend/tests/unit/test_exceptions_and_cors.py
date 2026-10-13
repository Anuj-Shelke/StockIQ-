def test_not_found_exception_structure(client):
    response = client.get("/api/v1/invalid-route-does-not-exist")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "NOT_FOUND"
    assert "request_id" in data


def test_validation_error_structure(client):
    # Missing required body
    response = client.post("/api/v1/auth/login", json={})
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "details" in data["error"]
    assert len(data["error"]["details"]) > 0
    assert "request_id" in data


def test_cors_headers(client):
    headers = {
        "Origin": "http://localhost:5173",
    }
    response = client.get("/health", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_custom_request_id_propagation(client):
    custom_id = "test-req-custom-987"
    response = client.get("/health", headers={"X-Request-ID": custom_id})
    assert response.status_code == 200
    assert response.headers.get("X-Request-ID") == custom_id

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "StockIQ" in data["message"]
    assert "docs_url" in data
    assert "X-Request-ID" in response.headers
    assert "X-Process-Time" in response.headers


def test_public_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "StockIQ" in data["app"]
    assert "version" in data


def test_public_readiness_endpoint(client):
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["ready", "degraded"]
    assert "database" in data
    assert "environment" in data


def test_api_v1_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_api_v1_readiness_endpoint(client):
    response = client.get("/api/v1/ready")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data


def test_openapi_documentation_accessible(client):
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert "openapi" in schema
    assert "paths" in schema
    assert "/health" in schema["paths"]
    assert "/ready" in schema["paths"]
    assert "/api/v1/auth/register" in schema["paths"]

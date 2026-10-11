def test_get_stocks_list(client):
    response = client.get("/api/v1/stocks")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data
    assert len(data["items"]) > 0


def test_get_stocks_search(client):
    response = client.get("/api/v1/stocks?search=TCS")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any("TCS" in item["symbol"] for item in data["items"])


def test_get_stock_detail(client):
    response = client.get("/api/v1/stocks/RELIANCE.NS")
    assert response.status_code == 200
    data = response.json()
    assert data["symbol"] == "RELIANCE.NS"
    assert "price_history" in data
    assert len(data["price_history"]) > 0


def test_get_stock_not_found(client):
    response = client.get("/api/v1/stocks/NONEXISTENT_SYMBOL")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "NOT_FOUND"


def test_get_dashboard(client, auth_headers):
    response = client.get("/api/v1/dashboard", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "portfolios" in data
    assert len(data["metrics"]) >= 4
    assert any(m["title"] == "Portfolio Value" for m in data["metrics"])

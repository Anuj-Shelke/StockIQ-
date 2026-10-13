def test_get_market_status(client):
    """Test market session status endpoint."""
    response = client.get("/api/v1/market/status")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "is_open" in data
    assert "session_label" in data
    assert "current_time_ist" in data
    assert "trading_hours" in data


def test_get_nifty_quote(client):
    """Test live NIFTY 50 quote endpoint."""
    response = client.get("/api/v1/market/nifty")
    assert response.status_code == 200
    data = response.json()
    assert data["symbol"] == "^NSEI"
    assert data["name"] == "NIFTY 50"
    assert "current_price" in data
    assert data["current_price"] > 0
    assert "change" in data
    assert "change_percent" in data
    assert "market_status" in data


def test_get_market_indices(client):
    """Test all supported Indian benchmark indices."""
    response = client.get("/api/v1/market/indices")
    assert response.status_code == 200
    data = response.json()
    assert "indices" in data
    assert len(data["indices"]) == 4
    symbols = [idx["symbol"] for idx in data["indices"]]
    assert "^NSEI" in symbols
    assert "^NSEBANK" in symbols
    assert "^CNXIT" in symbols
    assert "^BSESN" in symbols


def test_get_intraday_chart(client):
    """Test intraday 5-min chart points."""
    response = client.get("/api/v1/market/chart?symbol=^NSEI&interval=5m")
    assert response.status_code == 200
    data = response.json()
    assert data["symbol"] == "^NSEI"
    assert "points" in data
    assert len(data["points"]) > 0
    first_pt = data["points"][0]
    assert "time" in first_pt
    assert "price" in first_pt

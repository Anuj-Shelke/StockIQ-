def test_portfolio_lifecycle(client, auth_headers):
    # Create portfolio
    payload = {
        "name": "Retirement Corpus",
        "description": "Long-term safe wealth builder",
        "holdings": [
            {
                "symbol": "RELIANCE.NS",
                "asset_type": "stock",
                "quantity": 10.0,
                "buy_price": 2800.0,
                "current_price": 2980.5,
            },
            {
                "symbol": "GOLD",
                "asset_type": "gold",
                "quantity": 2.0,
                "buy_price": 72000.0,
                "current_price": 75400.0,
            },
        ],
    }
    create_res = client.post("/api/v1/portfolios", json=payload, headers=auth_headers)
    assert create_res.status_code == 201
    portfolio = create_res.json()
    assert portfolio["name"] == "Retirement Corpus"
    assert len(portfolio["holdings"]) == 2
    portfolio_id = portfolio["id"]

    # Get specific portfolio
    get_res = client.get(f"/api/v1/portfolios/{portfolio_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == portfolio_id

    # List portfolios
    list_res = client.get("/api/v1/portfolios", headers=auth_headers)
    assert list_res.status_code == 200
    assert any(p["id"] == portfolio_id for p in list_res.json())


def test_prediction_generation(client, auth_headers):
    payload = {
        "stock_symbol": "INFY.NS",
        "target_horizon": "30d",
    }
    response = client.post("/api/v1/predictions", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["stock_symbol"] == "INFY.NS"
    assert "predicted_price" in data
    assert "factors" in data
    assert len(data["factors"]) > 0


def test_stress_test_simulation(client, auth_headers):
    payload = {
        "scenario": "covid_crash",
        "initial_capital": 500000.0,
    }
    response = client.post("/api/v1/predictions/simulate", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["scenario"] == "covid_crash"
    assert data["max_drawdown_percent"] < 0
    assert data["simulated_loss_inr"] > 0
    assert "explanation" in data


def test_chatbot_query(client, auth_headers):
    payload = {
        "query": "Explain what is maximum drawdown and how it impacts risk?",
    }
    response = client.post("/api/v1/chatbot/query", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "drawdown" in data["answer"].lower()
    assert len(data["sources"]) > 0

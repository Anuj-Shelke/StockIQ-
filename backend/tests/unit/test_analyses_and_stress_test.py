"""Unit tests for Risk Reality Check, Quantitative Metrics & Stress Testing."""

import pytest
from app.services.metrics_service import MetricsService


def test_metrics_service_calculations():
    """Verify quantitative finance calculation correctness."""
    # Volatility
    daily_returns = [0.01, -0.015, 0.02, -0.005, 0.012, -0.008, 0.015]
    vol = MetricsService.calculate_volatility(daily_returns)
    assert vol > 0.0

    # Max Drawdown
    prices = [100.0, 110.0, 105.0, 90.0, 95.0, 120.0]
    mdd = MetricsService.calculate_max_drawdown(prices)
    # Peak is 110, trough is 90 -> drop is 20/110 = 18.18%
    assert round(mdd, 1) == 18.2

    # VaR & CVaR
    var_95 = MetricsService.calculate_var(daily_returns, confidence=0.95)
    cvar_95 = MetricsService.calculate_cvar(daily_returns, confidence=0.95)
    assert var_95 >= 0.0
    assert cvar_95 >= var_95

    # Beta
    bench_returns = [0.008, -0.01, 0.015, -0.004, 0.010, -0.006, 0.012]
    beta = MetricsService.calculate_beta(daily_returns, bench_returns)
    assert beta > 0.5

    # Sharpe & Sortino
    sharpe = MetricsService.calculate_sharpe_ratio(daily_returns)
    sortino = MetricsService.calculate_sortino_ratio(daily_returns)
    assert isinstance(sharpe, float)
    assert isinstance(sortino, float)


def test_list_stress_scenarios(client, auth_headers):
    """Test retrieving available historical stress scenarios."""
    res = client.get("/api/v1/analyses/stress-scenarios", headers=auth_headers)
    assert res.status_code == 200
    scenarios = res.json()
    assert len(scenarios) == 3
    scenario_ids = [s["id"] for s in scenarios]
    assert "covid-19" in scenario_ids
    assert "gfc-2008" in scenario_ids
    assert "rate-shock-2022" in scenario_ids


def test_get_risk_metrics(client, auth_headers):
    """Test quantitative risk metrics endpoint."""
    res = client.get("/api/v1/analyses/risk-metrics", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "annualized_volatility" in data
    assert "max_drawdown" in data
    assert "var_95" in data
    assert "var_99" in data
    assert "cvar_95" in data
    assert "beta" in data
    assert "sharpe_ratio" in data
    assert "sortino_ratio" in data


def test_get_risk_reality_check_flow(client, auth_headers):
    """Test complete Risk Reality Check lifecycle."""
    # 1. Create a portfolio first
    p_payload = {
        "name": "Balanced Defense",
        "holdings": [
            {"symbol": "RELIANCE.NS", "asset_type": "stock", "quantity": 10.0, "buy_price": 2800.0, "current_price": 2950.0},
            {"symbol": "GOLD", "asset_type": "gold", "quantity": 3.0, "buy_price": 7000.0, "current_price": 7500.0},
        ],
    }
    p_res = client.post("/api/v1/portfolios", json=p_payload, headers=auth_headers)
    assert p_res.status_code == 201
    portfolio_id = p_res.json()["id"]

    # 2. Run Risk Reality Check for this portfolio
    rrc_res = client.get(f"/api/v1/analyses/risk-reality-check/{portfolio_id}", headers=auth_headers)
    assert rrc_res.status_code == 200
    rrc_data = rrc_res.json()
    assert rrc_data["portfolio_name"] == "Balanced Defense"
    assert rrc_data["total_value"] > 0
    assert len(rrc_data["scenarios"]) == 3
    assert len(rrc_data["drawdown_series"]) > 0
    assert len(rrc_data["asset_contributions"]) == 2
    assert rrc_data["risk_tolerance_profile"]["historical_reality_level"] in ["Fragile", "Moderate", "Bulletproof"]

    # 3. Post custom stress test simulation
    sim_res = client.post(
        "/api/v1/analyses/stress-test",
        json={"portfolio_id": portfolio_id, "scenario_id": "gfc-2008", "initial_capital": 500000.0},
        headers=auth_headers,
    )
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert sim_data["active_scenario_id"] == "gfc-2008"
    assert sim_data["total_value"] == 500000.0

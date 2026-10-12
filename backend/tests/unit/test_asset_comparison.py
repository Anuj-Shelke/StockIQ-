"""Unit tests for Cross-Asset Comparison Engine (Equities vs Gold vs Fixed Deposit)."""

import pytest
from app.schemas.asset_comparison import AssetComparisonParams
from app.services.asset_comparison_service import AssetComparisonService
from app.services.fd_service import FDService
from app.services.gold_service import GoldService


def test_gold_service_trajectory():
    """Verify physical gold trajectory compounding."""
    yearly_vals, metrics = GoldService.calculate_trajectory(
        initial_investment=100000.0,
        monthly_sip=5000.0,
        years=5,
        inflation_adjusted=False,
    )
    assert len(yearly_vals) == 6  # Start + 5 years
    assert yearly_vals[-1] > 100000.0
    assert metrics["cagr"] > 0.0
    assert metrics["max_drawdown"] == 14.2
    assert metrics["risk_level"] == "Medium"


def test_fd_service_compounding():
    """Verify Bank FD quarterly compounding."""
    yearly_vals, metrics = FDService.calculate_trajectory(
        initial_investment=100000.0,
        monthly_sip=0.0,
        years=3,
        annual_rate_percent=7.0,
        inflation_adjusted=False,
    )
    assert len(yearly_vals) == 4
    # 100k compounded quarterly at 7% for 3 years
    assert yearly_vals[-1] > 120000.0
    assert metrics["max_drawdown"] == 0.0
    assert metrics["risk_level"] == "Low"


def test_asset_comparison_service():
    """Test unified multi-asset comparison logic."""
    params = AssetComparisonParams(
        initial_investment=100000.0,
        monthly_sip=10000.0,
        time_horizon="5Y",
        fd_rate_override=7.5,
        inflation_adjusted=False,
    )
    res = AssetComparisonService.compare_assets(params)
    assert len(res.trajectory) == 6  # Start + 5 years
    assert len(res.metrics) == 3
    assert res.winner_asset == "Equities (NIFTY 50)"
    assert res.inflation_rate == 5.5
    assert len(res.key_takeaway) > 10


def test_asset_comparison_endpoints(client, auth_headers):
    """Test REST API endpoints for asset comparison."""
    # 1. GET /rates
    rates_res = client.get("/api/v1/asset-comparison/rates", headers=auth_headers)
    assert rates_res.status_code == 200
    rates_data = rates_res.json()
    assert "equities_nifty_10y_cagr" in rates_data
    assert "gold_24k_10y_cagr" in rates_data
    assert "bank_fd_average_rate" in rates_data

    # 2. POST /compare
    payload = {
        "initial_investment": 200000.0,
        "monthly_sip": 15000.0,
        "time_horizon": "3Y",
        "fd_rate_override": 7.2,
        "inflation_adjusted": False,
    }
    post_res = client.post("/api/v1/asset-comparison/compare", json=payload, headers=auth_headers)
    assert post_res.status_code == 200
    data = post_res.json()
    assert len(data["trajectory"]) == 4  # Start + 3 years
    assert len(data["metrics"]) == 3
    assert data["params"]["initial_investment"] == 200000.0

    # 3. GET /compare with query parameters
    get_res = client.get(
        "/api/v1/asset-comparison/compare?initial_investment=50000&monthly_sip=5000&time_horizon=1Y",
        headers=auth_headers,
    )
    assert get_res.status_code == 200
    assert len(get_res.json()["trajectory"]) == 2  # Start + 1 year

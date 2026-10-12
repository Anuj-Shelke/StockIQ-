"""Unit tests for Machine Learning Price Forecasting & Explainable AI (SHAP) Pipeline."""

import pytest
from app.schemas.prediction import PredictionRequest
from app.services.explanation_service import ExplanationService
from app.services.prediction_service import PredictionService


def test_shap_decomposition_exact_additive_property():
    """Verify that SHAP attributions sum to target_price - base_value."""
    base_val = 2800.0
    target_val = 2950.0
    factors = ExplanationService.decompose_prediction(
        symbol="RELIANCE.NS",
        current_price=2800.0,
        target_price=target_val,
        base_value=base_val,
    )
    assert len(factors) == 5
    total_impact = sum(f.impact_value for f in factors)
    expected_delta = target_val - base_val
    assert round(total_impact, 2) == round(expected_delta, 2)

    categories = {f.category for f in factors}
    assert "Fundamental" in categories
    assert "Technical" in categories
    assert "Sentiment" in categories


def test_prediction_service_pipeline():
    """Verify PredictionService generates complete forecast with confidence bounds."""
    req = PredictionRequest(stock_symbol="TCS.NS", target_horizon="30d")
    res = PredictionService.generate_prediction(req)
    assert res.stock_symbol == "TCS.NS"
    assert res.current_price > 0
    assert res.predicted_price > 0
    assert res.confidence_score > 0.5
    assert res.detail is not None
    assert res.detail.lower_bound < res.detail.target_price < res.detail.upper_bound
    assert len(res.factors) > 0


def test_prediction_endpoints(client, auth_headers):
    """Verify REST API endpoints for predictions."""
    # 1. POST /api/v1/predictions
    post_res = client.post(
        "/api/v1/predictions",
        json={"stock_symbol": "INFY.NS", "target_horizon": "30d"},
        headers=auth_headers,
    )
    assert post_res.status_code == 200
    data = post_res.json()
    assert data["stock_symbol"] == "INFY.NS"
    assert len(data["factors"]) > 0
    assert data["detail"]["symbol"] == "INFY.NS"

    # 2. GET /api/v1/predictions/RELIANCE.NS
    get_res = client.get(
        "/api/v1/predictions/RELIANCE.NS?target_horizon=30d",
        headers=auth_headers,
    )
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert "RELIANCE.NS" in get_data["stock_symbol"]
    assert get_data["detail"]["confidence_score"] == 84.0

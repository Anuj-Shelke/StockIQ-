"""Unit tests for ML Personalized Stock Recommendations service and endpoints."""

import pytest
from app.schemas.recommendation import RecommendationRequest
from app.services.recommendation_service import RecommendationService


def test_recommendation_young_aggressive_investor():
    """Test young investor with high runway receives growth-oriented equity allocation."""
    req = RecommendationRequest(
        age=24,
        annual_income=1800000.0,
        investment_amount=150000.0,
        investment_horizon_years=10,
        risk_tolerance="dynamic",
    )
    res = RecommendationService.generate_recommendations(req)

    assert res.investor_summary.calculated_risk_capacity in ("Aggressive", "Moderate-Aggressive")
    assert res.investor_summary.recommended_asset_allocation.equity_pct >= 70.0
    assert len(res.recommended_stocks) >= 3
    # Check that recommended stocks have valid prices, targets, and positive returns
    for stock in res.recommended_stocks:
        assert stock.current_price > 0
        assert stock.ml_predicted_target > stock.current_price
        assert stock.projected_return_pct > 0
        assert "24" in stock.personalized_rationale  # contains age context


def test_recommendation_senior_conservative_investor():
    """Test senior investor with short runway receives capital preservation asset allocation."""
    req = RecommendationRequest(
        age=62,
        annual_income=800000.0,
        investment_amount=500000.0,
        investment_horizon_years=2,
        risk_tolerance="conservative",
    )
    res = RecommendationService.generate_recommendations(req)

    assert res.investor_summary.calculated_risk_capacity == "Conservative"
    assert res.investor_summary.recommended_asset_allocation.equity_pct <= 45.0
    assert res.investor_summary.recommended_asset_allocation.fixed_income_pct >= 40.0
    assert res.macro_hedges.gold_allocation_amount > 0
    assert res.macro_hedges.fixed_deposit_allocation_amount > 0


def test_recommendation_allocation_sums_to_100_percent():
    """Test that all macro asset allocations sum up to 100%."""
    req = RecommendationRequest(
        age=35,
        annual_income=1200000.0,
        investment_amount=200000.0,
        investment_horizon_years=5,
    )
    res = RecommendationService.generate_recommendations(req)
    alloc = res.investor_summary.recommended_asset_allocation
    total_pct = round(alloc.equity_pct + alloc.fixed_income_pct + alloc.gold_pct + alloc.cash_buffer_pct, 1)
    assert 99.5 <= total_pct <= 100.5

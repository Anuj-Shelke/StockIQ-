"""Unit and API tests for AI Personal Investment Planner & Portfolio Optimizer."""

import pytest
from datetime import date
from decimal import Decimal
from fastapi import status

from app.schemas.investment_planner import (
    PlannerProfileInput,
    PlanSimulateRequest,
)
from app.services.allocation_engine import AssetAllocationEngine
from app.services.fd_planner_engine import FDPlannerEngine
from app.services.gold_planner_engine import GoldPlannerEngine
from app.services.investment_planner_service import InvestmentPlannerService
from app.services.planner_stock_engine import PlannerStockEngine
from app.services.portfolio_risk_engine import PortfolioRiskEngine
from app.services.projection_engine import WealthProjectionEngine
from app.services.suitability_engine import SuitabilityEngine
from app.services.tax_integration_service import TaxIntegrationService
from app.services.tax_engine import TaxComputationEngine


def test_suitability_adequate_emergency_fund():
    """Verify suitability assessment when emergency savings are adequate."""
    profile = PlannerProfileInput(
        age=30,
        monthly_income=100000.0,
        monthly_expenses=40000.0,
        monthly_savings=35000.0,
        emergency_fund=250000.0,  # > 6 months
        debt_obligations=15000.0,
        financial_dependents=1,
        current_investable_capital=500000.0,
        primary_goal="Wealth Creation",
        target_amount=1000000.0,
        target_years=5.0,
        risk_tolerance="Moderate",
    )
    res = SuitabilityEngine.evaluate(profile)

    assert res.emergency_fund_adequate is True
    assert res.suggested_liquid_reserve == 0.0
    assert res.investable_capital_allocated == 500000.0
    assert res.monthly_surplus == 45000.0
    assert res.debt_to_income_ratio == 15.0
    assert res.risk_capacity_score > 50.0
    assert res.composite_risk_rating in ["Moderate", "High"]


def test_suitability_inadequate_emergency_fund_reserves_liquid():
    """Verify suitability carves out liquid safety reserve when emergency fund is inadequate."""
    profile = PlannerProfileInput(
        age=28,
        monthly_income=60000.0,
        monthly_expenses=30000.0,
        monthly_savings=15000.0,
        emergency_fund=10000.0,  # Less than 1 month!
        debt_obligations=10000.0,
        financial_dependents=0,
        current_investable_capital=200000.0,
        primary_goal="Wealth Creation",
        target_amount=400000.0,
        target_years=3.0,
        risk_tolerance="High",
    )
    res = SuitabilityEngine.evaluate(profile)

    assert res.emergency_fund_adequate is False
    assert res.suggested_liquid_reserve > 0.0
    assert res.investable_capital_allocated < 200000.0
    # Must contain warning regarding emergency reserve
    assert any("Emergency Reserve Warning" in w for w in res.warnings)


def test_asset_allocation_sums_to_100_percent():
    """Verify that computed asset allocation percentages sum to exactly 100.00% and amounts match investable capital."""
    profile = PlannerProfileInput(
        age=35,
        monthly_income=120000.0,
        monthly_expenses=50000.0,
        monthly_savings=40000.0,
        emergency_fund=300000.0,
        debt_obligations=10000.0,
        financial_dependents=2,
        current_investable_capital=500000.0,
        primary_goal="Wealth Creation",
        target_amount=1200000.0,
        target_years=5.0,
        risk_tolerance="Moderate",
    )
    suitability = SuitabilityEngine.evaluate(profile)
    allocations = AssetAllocationEngine.compute_allocation(profile, suitability)

    total_pct = round(sum(a.allocation_pct for a in allocations), 2)
    total_amt = round(sum(a.allocated_amount for a in allocations), 2)

    assert total_pct == 100.00
    assert abs(total_amt - suitability.investable_capital_allocated) < 0.05
    assert len(allocations) == 4
    classes = {a.asset_class for a in allocations}
    assert classes == {"Fixed Deposits", "Gold", "Stocks", "Diversified Index Funds"}


def test_wealth_projections_compounding_and_inflation():
    """Verify multi-scenario compounding trajectories and real inflation discounting."""
    profile = PlannerProfileInput(
        age=29,
        monthly_income=80000.0,
        monthly_expenses=35000.0,
        monthly_savings=25000.0,
        emergency_fund=200000.0,
        current_investable_capital=300000.0,
        primary_goal="Retirement Planning",
        target_years=10.0,
        risk_tolerance="High",
        monthly_sip_amount=5000.0,
    )
    suitability = SuitabilityEngine.evaluate(profile)
    allocations = AssetAllocationEngine.compute_allocation(profile, suitability)
    projections = WealthProjectionEngine.calculate_projections(
        allocations=allocations,
        horizon_years=10,
        monthly_sip=5000.0,
        inflation_rate=0.055,
    )

    assert projections.investment_horizon_years == 10
    assert len(projections.yearly_trajectory) == 10
    final_year = projections.yearly_trajectory[-1]

    # Principal = 3,00,000 + (5,000 * 12 * 10) = 9,00,000
    assert final_year.total_invested == 900000.0
    # Optimistic > Base > Conservative > Total Invested
    assert final_year.optimistic_value > final_year.base_value
    assert final_year.base_value > final_year.conservative_value
    assert final_year.conservative_value > final_year.total_invested
    # Inflation adjusted real purchasing power must be strictly less than nominal base value
    assert final_year.inflation_adjusted_base_value < final_year.base_value


def test_portfolio_risk_engine_metrics():
    """Verify expected return, volatility, Sharpe ratio, and Value at Risk."""
    profile = PlannerProfileInput(
        age=32,
        monthly_income=150000.0,
        monthly_expenses=60000.0,
        monthly_savings=50000.0,
        emergency_fund=400000.0,
        current_investable_capital=600000.0,
        primary_goal="Wealth Creation",
        target_years=5.0,
        risk_tolerance="Moderate",
    )
    suitability = SuitabilityEngine.evaluate(profile)
    allocations = AssetAllocationEngine.compute_allocation(profile, suitability)
    risk = PortfolioRiskEngine.analyze_risk(allocations)

    assert risk.expected_annual_return_pct > 8.0
    assert risk.annualized_volatility_pct > 0.0
    assert risk.sharpe_ratio > 0.0
    assert risk.maximum_drawdown_pct >= 0.0
    assert risk.value_at_risk_95_pct >= 0.0
    assert risk.asset_concentration_hhi > 0.0


def test_planner_stock_engine_selection():
    """Verify stock selection from catalog with ML confidence and SHAP drivers."""
    stocks = PlannerStockEngine.select_stock_allocations(
        total_equity_amount=200000.0,
        risk_tier="Moderate",
    )
    assert len(stocks) >= 3
    total_amt = sum(s.allocated_amount for s in stocks)
    assert abs(total_amt - 200000.0) < 1.0
    for s in stocks:
        assert s.current_price > 0.0
        assert s.target_price > 0.0
        assert s.beta > 0.0
        assert len(s.key_shap_drivers) > 0


def test_fd_planner_engine_quarterly_compounding_and_dicgc():
    """Verify quarterly compounding and DICGC protection for bank fixed deposits."""
    options = FDPlannerEngine.generate_options(allocated_amount=400000.0, horizon_years=3.0)
    assert len(options) == 4
    for opt in options:
        assert opt.allocated_amount == 100000.0
        assert opt.maturity_amount > opt.allocated_amount
        assert opt.total_interest_earned > 0.0
        assert opt.dicgc_protected is True
        assert opt.dicgc_limit == 500000.0


def test_gold_planner_engine_options():
    """Verify gold options comparison across Gold ETF, SGB, and Physical Gold."""
    gold_opts = GoldPlannerEngine.generate_options(allocated_amount=100000.0)
    assert len(gold_opts) == 3
    types = {g.product_type for g in gold_opts}
    assert any("ETF" in t for t in types)
    assert any("Sovereign Gold Bond" in t for t in types)
    assert any("Physical Gold" in t for t in types)


def test_tax_integration_service_reuses_tax_engine():
    """Verify TaxIntegrationService directly integrates with StockIQ TaxComputationEngine."""
    tax_summary = TaxIntegrationService.evaluate_portfolio_tax(
        total_investable=500000.0,
        horizon_years=5.0,
        equity_allocation_amount=150000.0,
        fd_allocation_amount=125000.0,
        gold_allocation_amount=75000.0,
        mutual_fund_allocation_amount=150000.0,
        projected_equity_gain=120000.0,
        projected_fd_gain=45000.0,
        projected_gold_gain=35000.0,
        projected_mf_gain=110000.0,
        investor_slab_rate_pct=20.0,
    )

    assert tax_summary.pre_tax_expected_gain == 310000.0
    assert tax_summary.estimated_total_tax > 0.0
    assert tax_summary.post_tax_expected_gain < tax_summary.pre_tax_expected_gain
    assert tax_summary.post_tax_portfolio_value > 500000.0
    assert "Section 112A" in tax_summary.equity_section_applied
    assert "Section 56" in tax_summary.fd_tax_provision
    assert len(tax_summary.tax_assumptions) >= 3


def test_what_if_simulation():
    """Verify interactive simulation recalculates metrics accurately."""
    req = PlanSimulateRequest(
        investable_capital=500000.0,
        monthly_sip=10000.0,
        investment_horizon_years=5.0,
        allocations={
            "Fixed Deposits": 30.0,
            "Gold": 15.0,
            "Stocks": 35.0,
            "Diversified Index Funds": 20.0,
        },
        inflation_rate_pct=5.5,
        investor_tax_slab_pct=20.0,
    )
    sim_res = InvestmentPlannerService.simulate_what_if(req)

    assert sim_res.investable_capital == 500000.0
    assert sim_res.monthly_sip == 10000.0
    assert sim_res.expected_annual_return_pct > 8.0
    assert sim_res.nominal_final_value > 500000.0
    assert sim_res.inflation_adjusted_final_value < sim_res.nominal_final_value
    assert sim_res.estimated_total_tax > 0.0
    assert sim_res.post_tax_portfolio_value > 500000.0


def test_api_generate_and_get_plan(client, auth_headers):
    """Test POST /api/v1/investment-planner/generate and GET by ID."""
    payload = {
        "age": 31,
        "occupation": "Software Engineer",
        "monthly_income": 120000.0,
        "monthly_expenses": 45000.0,
        "monthly_savings": 40000.0,
        "emergency_fund": 300000.0,
        "existing_investments": 500000.0,
        "debt_obligations": 15000.0,
        "financial_dependents": 1,
        "current_investable_capital": 500000.0,
        "primary_goal": "Wealth Creation",
        "target_amount": 1200000.0,
        "target_years": 5.0,
        "investment_horizon_category": "3-5 years",
        "risk_tolerance": "Moderate",
        "required_liquidity": "Moderate",
        "max_acceptable_loss_pct": 15.0,
        "investment_style": "HYBRID",
        "monthly_sip_amount": 10000.0,
        "preferred_asset_classes": ["Stocks", "Gold", "Fixed Deposits"],
        "preferred_sectors": ["Information Technology", "Banking & Financials"],
        "preferred_stocks": ["TCS.NS", "HDFCBANK.NS"],
    }

    # 1. Generate plan
    res = client.post("/api/v1/investment-planner/generate", json=payload, headers=auth_headers)
    assert res.status_code == status.HTTP_201_CREATED, res.text
    data = res.json()

    assert "plan_id" in data
    plan_id = data["plan_id"]
    assert data["suitability"]["risk_capacity_score"] > 0
    assert len(data["asset_allocation"]) == 4
    total_pct = sum(a["allocation_pct"] for a in data["asset_allocation"])
    assert round(total_pct, 1) == 100.0
    assert len(data["stock_allocations"]) >= 3
    assert len(data["fixed_deposits"]) == 4
    assert len(data["wealth_projections"]["yearly_trajectory"]) == 5
    assert data["tax_integration"]["estimated_total_tax"] > 0
    assert data["goal_timeline"]["target_amount"] == 1200000.0

    # 2. Retrieve by plan_id
    get_res = client.get(f"/api/v1/investment-planner/{plan_id}", headers=auth_headers)
    assert get_res.status_code == status.HTTP_200_OK
    retrieved = get_res.json()
    assert retrieved["plan_id"] == plan_id

    # 3. List history
    hist_res = client.get("/api/v1/investment-planner/history", headers=auth_headers)
    assert hist_res.status_code == status.HTTP_200_OK
    hist = hist_res.json()
    assert len(hist) >= 1
    assert any(h["plan_id"] == plan_id for h in hist)

    # 4. Simulate endpoint
    sim_payload = {
        "investable_capital": 500000.0,
        "monthly_sip": 15000.0,
        "investment_horizon_years": 5.0,
        "allocations": {
            "Fixed Deposits": 20.0,
            "Gold": 15.0,
            "Stocks": 40.0,
            "Diversified Index Funds": 25.0,
        },
        "inflation_rate_pct": 5.5,
        "investor_tax_slab_pct": 20.0,
    }
    sim_res = client.post("/api/v1/investment-planner/simulate", json=sim_payload, headers=auth_headers)
    assert sim_res.status_code == status.HTTP_200_OK
    sim_data = sim_res.json()
    assert sim_data["nominal_final_value"] > 500000.0

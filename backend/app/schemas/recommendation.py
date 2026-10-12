"""Pydantic schemas for Personalized Machine Learning Stock Recommendations."""

from datetime import datetime
from typing import List, Optional
from pydantic import Field
from app.schemas.common import APIBaseModel


class RecommendationRequest(APIBaseModel):
    """User input profile for ML stock & portfolio recommendation."""
    age: int = Field(default=30, ge=18, le=95, description="Investor age in years")
    annual_income: float = Field(default=1200000.0, ge=0.0, description="Annual income in INR")
    investment_amount: float = Field(default=100000.0, gt=0.0, description="Total capital to invest in INR")
    investment_horizon_years: int = Field(default=5, ge=1, le=40, description="Time horizon in years")
    risk_tolerance: Optional[str] = Field(
        default=None,
        pattern="^(conservative|moderate|aggressive|dynamic)$",
        description="Optional risk appetite override; defaults to dynamic ML calculation based on age and income",
    )
    primary_goal: Optional[str] = Field(
        default="wealth_creation",
        description="Primary financial goal (e.g., wealth_creation, retirement, capital_preservation)",
    )


class RecommendedStockItem(APIBaseModel):
    """Individual stock recommendation with ML forecasts and suitability."""
    symbol: str
    company_name: str
    sector: str
    market_cap_category: str
    current_price: float
    ml_predicted_target: float
    projected_return_pct: float
    suitability_score: float
    suitability_tier: str
    recommended_allocation_pct: float
    recommended_allocation_amount: float
    recommended_shares: int
    volatility_risk: str
    ml_confidence: float
    key_shap_drivers: List[str]
    personalized_rationale: str


class AssetAllocationBreakdown(APIBaseModel):
    """Macro asset allocation recommendation derived from demographic profiling."""
    equity_pct: float
    fixed_income_pct: float
    gold_pct: float
    cash_buffer_pct: float


class InvestorProfileSummary(APIBaseModel):
    """Quantitative risk capacity derived from age, income, investment, and horizon."""
    calculated_risk_capacity: str
    risk_score: float
    savings_ratio: float
    recommended_asset_allocation: AssetAllocationBreakdown


class NonEquityAllocation(APIBaseModel):
    """Hedging and fixed-income recommendations."""
    gold_allocation_amount: float
    gold_rationale: str
    fixed_deposit_allocation_amount: float
    fixed_deposit_rationale: str


class RecommendationResponse(APIBaseModel):
    """Full personalized stock recommendation response."""
    investor_summary: InvestorProfileSummary
    recommended_stocks: List[RecommendedStockItem]
    macro_hedges: NonEquityAllocation
    expected_portfolio_cagr: float
    disclaimer: str
    generated_at: datetime

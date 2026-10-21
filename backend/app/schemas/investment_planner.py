"""Pydantic schemas for AI Personal Investment Planner & Portfolio Optimizer."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class PlannerProfileInput(BaseModel):
    """User financial and personal profile inputs for investment planning."""
    # Personal & Financial Details
    age: int = Field(..., ge=18, le=100, description="Investor age (18-100)")
    occupation: Optional[str] = Field("Private Sector Employee", description="Occupation or profession")
    monthly_income: float = Field(..., ge=0.0, description="Total monthly post-tax income in INR")
    monthly_expenses: float = Field(..., ge=0.0, description="Total mandatory monthly living expenses in INR")
    monthly_savings: float = Field(..., ge=0.0, description="Average net monthly savings in INR")
    emergency_fund: float = Field(0.0, ge=0.0, description="Existing liquid emergency cash/savings balance in INR")
    existing_investments: float = Field(0.0, ge=0.0, description="Current value of existing investments across instruments in INR")
    debt_obligations: float = Field(0.0, ge=0.0, description="Total monthly EMI and debt service obligations in INR")
    financial_dependents: int = Field(0, ge=0, le=20, description="Number of financially dependent family members")
    current_investable_capital: float = Field(..., gt=0.0, description="Total available lump sum to allocate in INR")

    # Investment Goals & Horizons
    primary_goal: str = Field(
        "Wealth Creation",
        description="Goal: Capital preservation, Wealth creation, Retirement planning, Education planning, House purchase, Regular income, Emergency savings, Long-term financial independence",
    )
    target_amount: Optional[float] = Field(None, ge=0.0, description="Target financial goal amount in INR")
    target_years: float = Field(5.0, gt=0.0, le=50.0, description="Target completion timeline in years")
    investment_horizon_category: str = Field(
        "3-5 years",
        description="Horizon: 'Less than 1 year', '1-3 years', '3-5 years', '5-10 years', 'More than 10 years'",
    )

    # Risk & Liquidity
    risk_tolerance: str = Field(
        "Moderate",
        description="'Very Low', 'Low', 'Moderate', 'High'",
    )
    required_liquidity: str = Field(
        "Moderate",
        description="'High', 'Moderate', 'Low'",
    )
    max_acceptable_loss_pct: float = Field(
        15.0,
        ge=0.0,
        le=100.0,
        description="Maximum acceptable portfolio drawdown/loss percentage",
    )

    # Style & Recurring Contributions
    investment_style: str = Field(
        "LUMP_SUM",
        description="'LUMP_SUM', 'SIP', 'HYBRID', 'STAGGERED'",
    )
    monthly_sip_amount: float = Field(0.0, ge=0.0, description="Planned recurring monthly contribution in INR")

    # Preferences
    preferred_asset_classes: List[str] = Field(default_factory=lambda: ["Stocks", "Gold", "Fixed Deposits"])
    preferred_sectors: List[str] = Field(default_factory=list)
    preferred_stocks: List[str] = Field(default_factory=list)

    @field_validator("monthly_expenses")
    @classmethod
    def validate_expenses(cls, v: float, info) -> float:
        # Expenses cannot exceed 3x income if income provided
        return v


class SuitabilityAssessment(BaseModel):
    """Financial suitability and capacity assessment distinguishing tolerance from capacity."""
    risk_tolerance: str
    risk_capacity_score: float = Field(..., ge=0.0, le=100.0)
    risk_capacity_level: str  # "Very Low", "Low", "Moderate", "High"
    composite_risk_rating: str
    monthly_surplus: float
    debt_to_income_ratio: float
    emergency_fund_months: float
    suggested_liquid_reserve: float
    emergency_fund_adequate: bool
    investable_capital_allocated: float
    total_capital_provided: float
    suggested_investment_horizon_years: float
    goal_feasibility_score: float = Field(..., ge=0.0, le=100.0)
    goal_feasibility_status: str  # "Highly Achievable", "Feasible", "Challenging", "Requires Adjustment"
    suitability_narrative: str
    key_assumptions: List[str]
    warnings: List[str]


class AssetAllocationItem(BaseModel):
    """Detailed asset class allocation specification."""
    asset_class: str  # "Fixed Deposits", "Gold", "Stocks", "Diversified Index Funds"
    category_label: str
    allocation_pct: float
    allocated_amount: float
    expected_return_pct: float
    risk_level: str
    liquidity: str
    reason: str


class StockAllocationItem(BaseModel):
    """Individual equity/ETF allocation derived from existing StockIQ recommendation universe."""
    symbol: str
    company_name: str
    sector: str
    market_cap_category: str
    current_price: float
    target_price: float
    projected_return_pct: float
    beta: float
    volatility_risk: str
    ml_confidence: float
    weight_pct: float
    allocated_amount: float
    key_shap_drivers: List[str]
    recommendation_signal: str


class FixedDepositOption(BaseModel):
    """Comparative Fixed Deposit product offer in Indian market."""
    institution: str
    category: str  # "Public Sector Bank", "Private Sector Bank", "Small Finance Bank", "Post Office"
    interest_rate_pct: float
    tenure_months: int
    compounding_method: str
    allocated_amount: float
    maturity_amount: float
    total_interest_earned: float
    dicgc_protected: bool
    dicgc_limit: float
    premature_withdrawal_condition: str
    liquidity_note: str


class GoldProductOption(BaseModel):
    """Gold asset vehicle analysis and comparison."""
    product_type: str  # "Gold ETF", "Sovereign Gold Bond (SGB)", "Physical Gold 24K"
    product_name: str
    unit_market_rate: float
    allocated_amount: float
    historical_10yr_cagr: float
    transaction_costs: str
    storage_costs: str
    liquidity: str
    tracking_difference: str
    tax_treatment: str
    risk_summary: str


class WealthProjectionYear(BaseModel):
    """Yearly wealth trajectory point across 3 market scenarios and inflation adjustment."""
    year: int
    total_invested: float
    conservative_value: float
    base_value: float
    optimistic_value: float
    inflation_adjusted_base_value: float
    inflation_discount_factor: float


class WealthProjectionSummary(BaseModel):
    """Aggregated future wealth projections and scenarios."""
    investment_horizon_years: int
    initial_lump_sum: float
    monthly_sip: float
    total_principal_invested: float
    conservative_final_value: float
    base_final_value: float
    optimistic_final_value: float
    base_inflation_adjusted_value: float
    projected_annual_cagr_base: float
    yearly_trajectory: List[WealthProjectionYear]
    inflation_assumption_pct: float
    disclaimer: str


class PortfolioRiskAnalysis(BaseModel):
    """Comprehensive portfolio-level risk and diversification analytics."""
    expected_annual_return_pct: float
    annualized_volatility_pct: float
    sharpe_ratio: float
    maximum_drawdown_pct: float
    value_at_risk_95_pct: float
    downside_risk_pct: float
    asset_concentration_hhi: float
    sector_concentration: Dict[str, float]
    liquidity_exposure_score: str  # "High", "Moderate", "Balanced", "Low"
    inflation_risk_rating: str  # "Protected", "Moderate", "High Exposure"
    risk_metrics_explanation: Dict[str, str]
    historical_vs_predictive_note: str


class TaxIntegrationSummary(BaseModel):
    """Integration with existing StockIQ Tax Computation module u/s 111A, 112A, and Budget 2024."""
    pre_tax_expected_gain: float
    estimated_equity_ltcg_tax: float
    estimated_fd_slab_tax: float
    estimated_gold_tax: float
    estimated_total_tax: float
    post_tax_expected_gain: float
    post_tax_portfolio_value: float
    effective_tax_rate_pct: float
    reused_tax_engine_rule: str
    equity_section_applied: str  # "Section 112A (Budget 2024: 12.5% over ₹1.25L)"
    fd_tax_provision: str        # "Section 56 (Income from Other Sources at Investor Slab)"
    gold_tax_provision: str      # "Section 112 (12.5% LTCG without indexation post-Budget 2024)"
    tax_assumptions: List[str]
    unsupported_tax_limitations: List[str]
    disclaimer: str


class GoalTimelineMilestone(BaseModel):
    """Timeline tracking progress toward financial goals."""
    year: int
    projected_corpus: float
    target_milestone: float
    gap_amount: float
    percent_achieved: float
    review_recommendation: str


class GoalTimelinePlan(BaseModel):
    """Financial goal feasibility and timeline analysis."""
    goal_name: str
    target_amount: float
    target_years: float
    projected_corpus_at_horizon: float
    surplus_or_shortfall: float
    is_goal_achievable: bool
    required_additional_monthly_sip: float
    milestones: List[GoalTimelineMilestone]
    remedial_actions: List[str]


class AlternativePortfolio(BaseModel):
    """Alternative portfolio scenario for comparative analysis."""
    name: str  # "Capital Preservation", "Balanced Growth", "Long-Term Growth"
    label: str
    description: str
    allocations: Dict[str, float]  # Asset class -> percentage
    expected_return_pct: float
    volatility_pct: float
    sharpe_ratio: float
    max_drawdown_pct: float
    estimated_after_tax_return_pct: float
    suitability: str
    pros: List[str]
    cons: List[str]


class ExplainabilityInsight(BaseModel):
    """Explainable rationale breaking down rule-based, optimization, ML, and preference drivers."""
    category: str  # "Rule-Based Suitability", "Mathematical Optimization", "ML Forecast Integration", "User Preference"
    asset_class: str
    driver: str
    explanation: str
    shap_features_referenced: Optional[List[str]] = None


class InvestmentPlanResponse(BaseModel):
    """Complete personalized investment plan and portfolio optimization report."""
    plan_id: str
    user_id: str
    created_at: str
    plan_name: str
    status: str
    profile_summary: PlannerProfileInput
    suitability: SuitabilityAssessment
    asset_allocation: List[AssetAllocationItem]
    stock_allocations: List[StockAllocationItem]
    fixed_deposits: List[FixedDepositOption]
    gold_analysis: List[GoldProductOption]
    wealth_projections: WealthProjectionSummary
    risk_analysis: PortfolioRiskAnalysis
    tax_integration: TaxIntegrationSummary
    goal_timeline: GoalTimelinePlan
    alternative_portfolios: List[AlternativePortfolio]
    explainability_insights: List[ExplainabilityInsight]


class PlanSimulateRequest(BaseModel):
    """Request for interactive What-If scenario simulations."""
    original_plan_id: Optional[str] = None
    investable_capital: float = Field(..., gt=0.0)
    monthly_sip: float = Field(0.0, ge=0.0)
    investment_horizon_years: float = Field(..., gt=0.0, le=50.0)
    allocations: Dict[str, float] = Field(
        ...,
        description="Asset class name to percentage, e.g. {'Fixed Deposits': 30, 'Gold': 15, 'Stocks': 35, 'Diversified Index Funds': 20}",
    )
    inflation_rate_pct: float = Field(5.5, ge=0.0, le=20.0)
    investor_tax_slab_pct: float = Field(20.0, ge=0.0, le=45.0)

    @field_validator("allocations")
    @classmethod
    def validate_allocations(cls, v: Dict[str, float]) -> Dict[str, float]:
        total = sum(v.values())
        if abs(total - 100.0) > 0.5:
            raise ValueError(f"Allocation percentages must sum to 100%, got {total:.2f}%")
        return v


class PlanSimulateResponse(BaseModel):
    """Outcome of interactive What-If simulation."""
    investable_capital: float
    monthly_sip: float
    investment_horizon_years: float
    allocations: Dict[str, float]
    allocation_amounts_inr: Dict[str, float]
    expected_annual_return_pct: float
    annualized_volatility_pct: float
    sharpe_ratio: float
    max_drawdown_pct: float
    nominal_final_value: float
    inflation_adjusted_final_value: float
    estimated_pre_tax_gain: float
    estimated_total_tax: float
    estimated_post_tax_gain: float
    post_tax_portfolio_value: float
    liquidity_implications: str
    comparison_vs_baseline: Dict[str, Any]

"""Pydantic schemas for Risk Reality Check, Quantitative Metrics & Stress Testing."""

from datetime import datetime
from typing import Dict, List, Literal, Optional
from pydantic import Field
from app.schemas.common import APIBaseModel


class QuantitativeRiskMetrics(APIBaseModel):
    """Core portfolio risk & volatility metrics."""
    annualized_volatility: float = Field(description="Annualized standard deviation of returns (%)")
    max_drawdown: float = Field(description="Historical Maximum Drawdown (%)")
    var_95: float = Field(description="Value at Risk at 95% confidence level (%)")
    var_99: float = Field(description="Value at Risk at 99% confidence level (%)")
    cvar_95: float = Field(description="Conditional VaR / Expected Shortfall at 95% (%)")
    beta: float = Field(description="Portfolio Beta relative to NIFTY 50")
    sharpe_ratio: float = Field(description="Risk-adjusted return Sharpe Ratio (Rf=6.5%)")
    sortino_ratio: float = Field(description="Downside deviation Sortino Ratio")
    cagr: float = Field(description="Compound Annual Growth Rate (%)")


class StressScenarioImpact(APIBaseModel):
    """Detailed simulated impact metrics on the portfolio under stress."""
    estimated_drawdown: float = Field(description="Peak-to-trough estimated portfolio decline (%)")
    value_at_risk_inr: float = Field(description="Simulated monetary loss at 95% confidence (INR)")
    recovery_months: int = Field(description="Months to recover to previous high")
    volatility_index: float = Field(description="Annualized volatility during stress period (%)")


class StressScenario(APIBaseModel):
    """Historical stress scenario definition and impact."""
    id: Literal["covid-19", "gfc-2008", "rate-shock-2022"]
    name: str
    period: str
    description: str
    benchmark_drawdown: float
    recovery_months: int
    portfolio_impact: StressScenarioImpact


class DrawdownDataPoint(APIBaseModel):
    """Time-series point for historical drawdown charts."""
    date: str
    portfolio_drawdown: float
    benchmark_drawdown: float


class AssetDrawdownContribution(APIBaseModel):
    """Asset-level vulnerability and drawdown contribution breakdown."""
    symbol: str
    name: str
    asset_type: str = "stock"
    allocation_weight: float
    max_decline: float
    contribution_to_drawdown: float
    status: Literal["High Vulnerability", "Moderate Impact", "Resilient Anchor"]


class RiskToleranceProfile(APIBaseModel):
    """Comparison of user stated risk perception against calculated reality."""
    stated_level: Literal["Conservative", "Moderate", "Aggressive"]
    stated_score: int = Field(ge=1, le=100)
    historical_reality_score: int = Field(ge=1, le=100)
    historical_reality_level: Literal["Fragile", "Moderate", "Bulletproof"]
    gap_description: str


class StressTestRequest(APIBaseModel):
    """Payload to request stress testing analysis."""
    portfolio_id: Optional[str] = None
    scenario_id: Optional[Literal["covid-19", "gfc-2008", "rate-shock-2022"]] = None
    initial_capital: Optional[float] = Field(default=None, gt=0)


class RiskExplainabilityFactor(APIBaseModel):
    """XAI factor attribution for historical drawdown and risk reality."""
    factor_name: str
    category: str = "Market Risk"
    impact_pct: float
    direction: Literal["risk_driver", "resilience_buffer"]
    description: str
    recommendation: str


class RiskRealityCheckResponse(APIBaseModel):
    """Complete Risk Reality Check assessment package."""
    portfolio_id: Optional[str] = None
    portfolio_name: str
    total_value: float
    metrics: QuantitativeRiskMetrics
    risk_tolerance_profile: RiskToleranceProfile
    scenarios: List[StressScenario]
    active_scenario_id: str
    drawdown_series: List[DrawdownDataPoint]
    asset_contributions: List[AssetDrawdownContribution]
    explainability_factors: Optional[List[RiskExplainabilityFactor]] = None
    actionable_mitigation_insights: Optional[List[str]] = None
    analyzed_at: datetime

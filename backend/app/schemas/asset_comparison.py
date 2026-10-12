"""Pydantic schemas for Cross-Asset Comparison (Equity vs Gold vs Fixed Deposit)."""

from typing import List, Literal, Optional
from pydantic import Field
from app.schemas.common import APIBaseModel

TimeHorizon = Literal["1Y", "3Y", "5Y", "10Y"]


class AssetComparisonParams(APIBaseModel):
    """Parameters for cross-asset simulation."""
    initial_investment: float = Field(default=100000.0, ge=1000.0, description="Lump sum investment in INR")
    monthly_sip: float = Field(default=10000.0, ge=0.0, description="Optional monthly SIP in INR")
    time_horizon: TimeHorizon = Field(default="5Y", description="Simulation tenure")
    fd_rate_override: float = Field(default=7.1, ge=3.0, le=15.0, description="Annual bank FD interest rate (%)")
    inflation_adjusted: bool = Field(default=False, description="Whether to discount values by inflation (CPI ~5.5%)")


class ComparisonDataPoint(APIBaseModel):
    """Synchronized wealth trajectory point for chart plotting."""
    period: str
    equity: float
    gold: float
    fixed_deposit: float


class AssetSummaryMetric(APIBaseModel):
    """Performance and structural properties of an asset class."""
    asset_class: Literal["Equities (NIFTY 50)", "Physical Gold (24K)", "Bank Fixed Deposit"]
    color: str
    total_final_value: float
    total_invested: float
    total_return_percent: float
    cagr: float
    max_drawdown: float
    liquidity: str
    tax_implication: str
    risk_level: Literal["High", "Medium", "Low"]


class AssetComparisonResponse(APIBaseModel):
    """Complete multi-asset comparison analysis response."""
    params: AssetComparisonParams
    trajectory: List[ComparisonDataPoint]
    metrics: List[AssetSummaryMetric]
    inflation_rate: float = 5.5
    winner_asset: str
    key_takeaway: str

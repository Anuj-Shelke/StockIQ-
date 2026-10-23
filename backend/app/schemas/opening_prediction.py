"""Pydantic schemas for Next-Day NSE and BSE Opening Price Predictions."""

from datetime import datetime
from typing import Dict, List, Optional
from pydantic import Field
from app.schemas.common import APIBaseModel


class OvernightFactor(APIBaseModel):
    """External overnight driver affecting the next day market opening price."""
    name: str
    impact_points: float
    percentage_contribution: float
    direction: str = Field(pattern="^(positive|negative|neutral)$")
    description: str


class NextDayOpeningQuote(APIBaseModel):
    """Next-day opening price prediction with quantile bands and gap probability."""
    symbol: str
    name: str
    exchange: str = Field(pattern="^(NSE|BSE)$")
    asset_type: str = Field(pattern="^(INDEX|EQUITY)$")
    last_close_price: float
    predicted_open_price: float
    expected_gap_points: float
    expected_gap_pct: float
    p_gap_up: float = Field(ge=0.0, le=1.0, description="Probability of opening higher than previous close")
    direction: str = Field(pattern="^(GAP_UP|GAP_DOWN|FLAT)$")
    open_p10: float = Field(description="10th percentile lower bound open estimate")
    open_p50: float = Field(description="Median / expected open estimate")
    open_p90: float = Field(description="90th percentile upper bound open estimate")
    confidence_score: float = Field(ge=0.0, le=1.0)
    overnight_factors: List[OvernightFactor]
    model_version: str = "Quantile-XGBoost-Open-v2.1"
    prediction_for_date: str
    updated_at: datetime


class NextDayOpeningOverviewResponse(APIBaseModel):
    """Overview response of all benchmark indices and major NSE/BSE equities."""
    market_sentiment: str = Field(pattern="^(BULLISH_GAP|BEARISH_GAP|NEUTRAL)$")
    gift_nifty_implied_open: float
    gift_nifty_gap_points: float
    gift_nifty_percentage: Optional[float] = 0.38
    usd_inr_drift_pct: float
    us_markets_summary: str
    sp500_change_pct: Optional[float] = 0.65
    nasdaq_change_pct: Optional[float] = 0.82
    brent_crude_price: Optional[float] = 78.40
    brent_crude_change_pct: Optional[float] = -1.10
    target_date_label: Optional[str] = ""
    indices: List[NextDayOpeningQuote]
    top_stocks: List[NextDayOpeningQuote]
    disclaimer: str
    timestamp: datetime

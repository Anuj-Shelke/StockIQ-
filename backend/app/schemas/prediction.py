"""Pydantic schemas for Machine Learning Price Forecasting & Explainable AI (SHAP)."""

from datetime import datetime
from typing import List, Literal, Optional
from pydantic import Field
from app.schemas.common import APIBaseModel


class ShapFactor(APIBaseModel):
    """Explainable AI SHAP factor attribution."""
    name: str
    feature_name: Optional[str] = None
    category: Literal["Macro", "Fundamental", "Technical", "Sentiment"] = "Technical"
    impact_value: float = Field(default=0.0, description="Exact attribution value in INR")
    importance_score: float = Field(default=0.0, description="Normalized importance weight")
    percentage_contribution: float = Field(default=0.0, description="Percentage contribution to total deviation")
    description: str = Field(default="")
    direction: Literal["positive", "negative"] = "positive"


class PredictionDetail(APIBaseModel):
    """Detailed metadata and confidence bounds for Explainability Visualizer."""
    symbol: str
    name: str
    current_price: float
    target_price: float
    forecast_horizon: str
    confidence_score: float
    lower_bound: float
    upper_bound: float
    base_value: float
    predicted_change: float
    predicted_change_percent: float
    model_architecture: str = "XGBoost Regressor (TreeExplainer)"
    historical_data_window: str = "500 Trading Days"
    features_considered: int = 12
    limitations: List[str] = []


class PredictionRequest(APIBaseModel):
    """Payload to request stock price forecasting."""
    stock_symbol: str
    target_horizon: str = Field(default="30d", pattern="^(7d|14d|30d|90d|1y)$")


class PredictionResponse(APIBaseModel):
    """Stock prediction response with SHAP factors and breakdown."""
    id: str
    stock_symbol: str
    model_name: str
    target_horizon: str
    current_price: float
    predicted_price: float
    confidence_score: float
    summary: Optional[str] = None
    detail: Optional[PredictionDetail] = None
    factors: List[ShapFactor] = []
    created_at: datetime


class SimulationRequest(APIBaseModel):
    """Historical stress test simulation payload."""
    portfolio_id: Optional[str] = None
    scenario: str = Field(default="covid_crash", description="Stress test scenario key")
    initial_capital: float = Field(default=100000.0, gt=0)


class SimulationResponse(APIBaseModel):
    """Stress test simulation response."""
    scenario: str
    scenario_name: str
    historical_period: str
    max_drawdown_percent: float
    simulated_loss_inr: float
    recovery_months: Optional[int] = None
    explanation: str

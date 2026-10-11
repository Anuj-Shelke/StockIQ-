from datetime import datetime
from typing import List, Optional
from pydantic import Field
from app.schemas.common import APIBaseModel


class ShapFactor(APIBaseModel):
    """Explainable AI SHAP factor."""
    feature_name: str
    importance_score: float
    direction: str  # positive, negative


class PredictionRequest(APIBaseModel):
    """Payload to request stock prediction."""
    stock_symbol: str
    target_horizon: str = Field(default="30d", pattern="^(7d|14d|30d|90d|1y)$")


class PredictionResponse(APIBaseModel):
    """Stock prediction response with SHAP factors."""
    id: str
    stock_symbol: str
    model_name: str
    target_horizon: str
    current_price: float
    predicted_price: float
    confidence_score: float
    summary: Optional[str] = None
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

"""Stock Price Forecasting & Explainable AI (SHAP) API Endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.prediction import (
    PredictionRequest,
    PredictionResponse,
    SimulationRequest,
    SimulationResponse,
)
from app.services.prediction_service import PredictionService


router = APIRouter()


@router.post("", response_model=PredictionResponse, summary="Generate stock price prediction with SHAP factors")
@router.post("/", response_model=PredictionResponse, summary="Generate stock price prediction with SHAP factors")
def generate_prediction(
    request: PredictionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> PredictionResponse:
    """Generate directional 30-day price target and exact SHAP feature attributions."""
    return PredictionService.generate_prediction(
        request=request,
        db=db,
        user_id=str(current_user.id),
    )


@router.get("/{symbol}", response_model=PredictionResponse, summary="Get prediction and explainability for stock")
def get_prediction_for_stock(
    symbol: str,
    target_horizon: str = Query("30d", pattern="^(7d|14d|30d|90d|1y)$"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> PredictionResponse:
    """Retrieve machine learning prediction and SHAP waterfall metrics for a specific stock ticker."""
    request = PredictionRequest(stock_symbol=symbol, target_horizon=target_horizon)
    return PredictionService.generate_prediction(
        request=request,
        db=db,
        user_id=str(current_user.id),
    )


@router.post("/simulate", response_model=SimulationResponse, summary="Simulate historical crash scenario")
def simulate_stress_scenario(
    request: SimulationRequest,
    current_user: User = Depends(get_current_active_user),
) -> SimulationResponse:
    """Simulate historical crash scenario impact on portfolio capital."""
    scenarios = {
        "covid_crash": {
            "name": "COVID-19 Market Shock (Feb - Mar 2020)",
            "period": "Feb 2020 - Jun 2020",
            "drawdown": -38.4,
            "recovery_months": 7,
            "explanation": "Simulates sharp liquidity contraction across equities. Large-caps dropped ~38% but recovered to baseline within 7 months as central banks intervened.",
        },
        "gfc_2008": {
            "name": "Global Financial Crisis (2008 - 2009)",
            "period": "Jan 2008 - Mar 2009",
            "drawdown": -54.0,
            "recovery_months": 24,
            "explanation": "Simulates structural credit and financial crisis. Severe multi-year drawdown requiring diversified hedge assets like Gold.",
        },
        "rate_hike_2022": {
            "name": "Global Inflation & Rate Hikes (2022)",
            "period": "Jan 2022 - Oct 2022",
            "drawdown": -15.2,
            "recovery_months": 6,
            "explanation": "Simulates tightening liquidity cycle, impacting high P/E tech and speculative equities while value and banking remained resilient.",
        },
    }

    selected = scenarios.get(request.scenario, scenarios["covid_crash"])
    simulated_loss = round(request.initial_capital * (abs(selected["drawdown"]) / 100.0), 2)

    return SimulationResponse(
        scenario=request.scenario,
        scenario_name=selected["name"],
        historical_period=selected["period"],
        max_drawdown_percent=selected["drawdown"],
        simulated_loss_inr=simulated_loss,
        recovery_months=selected["recovery_months"],
        explanation=selected["explanation"],
    )

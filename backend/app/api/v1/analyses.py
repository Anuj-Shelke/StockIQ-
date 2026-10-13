"""Portfolio Risk Reality Check and Quantitative Stress Testing API Endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.analysis import (
    QuantitativeRiskMetrics,
    RiskRealityCheckResponse,
    StressScenario,
    StressTestRequest,
)
from app.services.stress_test_service import StressTestService


router = APIRouter()


@router.get(
    "/stress-scenarios",
    response_model=List[StressScenario],
    summary="List available historical stress test scenarios",
)
def list_stress_scenarios(
    current_user: User = Depends(get_current_user),
) -> List[StressScenario]:
    """Retrieve pre-configured historical market stress periods (COVID-19, GFC 2008, 2022 Rate Hike)."""
    return StressTestService.get_all_scenarios()


@router.get(
    "/risk-metrics",
    response_model=QuantitativeRiskMetrics,
    summary="Calculate quantitative risk & volatility metrics",
)
def get_risk_metrics(
    portfolio_id: Optional[str] = Query(None, description="Optional portfolio ID to calculate metrics for"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> QuantitativeRiskMetrics:
    """Compute annualized volatility, max drawdown, VaR 95/99%, CVaR, beta, and Sharpe ratio."""
    analysis = StressTestService.run_risk_reality_check(
        db=db,
        user_id=str(current_user.id),
        portfolio_id=portfolio_id,
    )
    return analysis.metrics


@router.get(
    "/risk-reality-check",
    response_model=RiskRealityCheckResponse,
    summary="Run Risk Reality Check on user portfolio",
)
def get_risk_reality_check(
    portfolio_id: Optional[str] = Query(None, description="Portfolio ID (default to first active portfolio)"),
    scenario_id: str = Query("covid-19", description="Scenario ID (covid-19, gfc-2008, rate-shock-2022)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RiskRealityCheckResponse:
    """Execute complete risk reality assessment comparing stated tolerance vs historical shocks."""
    return StressTestService.run_risk_reality_check(
        db=db,
        user_id=str(current_user.id),
        portfolio_id=portfolio_id,
        active_scenario_id=scenario_id,
    )


@router.get(
    "/risk-reality-check/{portfolio_id}",
    response_model=RiskRealityCheckResponse,
    summary="Run Risk Reality Check on specific portfolio",
)
def get_risk_reality_check_by_id(
    portfolio_id: str,
    scenario_id: str = Query("covid-19", description="Active scenario key"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RiskRealityCheckResponse:
    """Execute risk reality check on specified portfolio with drawdown series and asset breakdown."""
    return StressTestService.run_risk_reality_check(
        db=db,
        user_id=str(current_user.id),
        portfolio_id=portfolio_id,
        active_scenario_id=scenario_id,
    )


@router.post(
    "/stress-test",
    response_model=RiskRealityCheckResponse,
    summary="Simulate stress test with custom parameters",
)
def run_custom_stress_test(
    request: StressTestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RiskRealityCheckResponse:
    """Run interactive stress test simulation with custom initial capital or scenario selection."""
    return StressTestService.run_risk_reality_check(
        db=db,
        user_id=str(current_user.id),
        portfolio_id=request.portfolio_id,
        active_scenario_id=request.scenario_id or "covid-19",
        initial_capital=request.initial_capital,
    )

"""FastAPI endpoints for AI Personal Investment Planner & Portfolio Optimizer."""

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.investment_planner import (
    InvestmentPlanResponse,
    PlannerProfileInput,
    PlanSimulateRequest,
    PlanSimulateResponse,
)
from app.services.investment_planner_service import InvestmentPlannerService

router = APIRouter()


@router.post(
    "/generate",
    response_model=InvestmentPlanResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate personalized multi-asset investment plan",
)
def generate_investment_plan(
    profile_input: PlannerProfileInput,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> InvestmentPlanResponse:
    """Analyze user financial profile, evaluate suitability, and generate a personalized investment plan.

    Allocates capital across Stocks, Gold, Fixed Deposits, and Diversified Funds,
    calculates multi-scenario wealth projections, evaluates portfolio risk, integrates
    stock predictions with SHAP explainability, and computes after-tax outcomes using
    the existing StockIQ Tax Computation module.
    """
    return InvestmentPlannerService.generate_plan(
        db=db,
        user_id=str(current_user.id),
        profile_input=profile_input,
        save_to_db=True,
    )


@router.post(
    "/simulate",
    response_model=PlanSimulateResponse,
    summary="Interactive What-If simulation across allocations and contributions",
)
def simulate_investment_scenario(
    request: PlanSimulateRequest,
    current_user: User = Depends(get_current_active_user),
) -> PlanSimulateResponse:
    """Simulate changes to asset allocation, investment horizon, monthly contributions, or inflation."""
    return InvestmentPlannerService.simulate_what_if(request=request)


@router.get(
    "/history",
    response_model=List[Dict[str, Any]],
    summary="Get user's saved investment plans history",
)
def get_investment_plans_history(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Retrieve audit history of previously generated investment plans for authenticated user."""
    return InvestmentPlannerService.get_plan_history(
        db=db,
        user_id=str(current_user.id),
        limit=limit,
    )


@router.get(
    "/{plan_id}",
    response_model=InvestmentPlanResponse,
    summary="Get full details of a saved investment plan",
)
def get_investment_plan_by_id(
    plan_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> InvestmentPlanResponse:
    """Retrieve full details of a saved investment plan with user isolation."""
    plan = InvestmentPlannerService.get_plan_by_id(
        db=db,
        user_id=str(current_user.id),
        plan_id=plan_id,
    )
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investment plan with ID '{plan_id}' not found.",
        )
    return plan

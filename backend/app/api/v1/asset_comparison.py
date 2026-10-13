"""Cross-Asset Comparison (Equities vs Physical Gold vs Bank Fixed Deposit) API Endpoints."""

from typing import Dict
from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.asset_comparison import (
    AssetComparisonParams,
    AssetComparisonResponse,
    TimeHorizon,
)
from app.services.asset_comparison_service import AssetComparisonService


router = APIRouter()


@router.post(
    "/compare",
    response_model=AssetComparisonResponse,
    summary="Simulate multi-asset wealth comparison",
)
def compare_assets(
    params: AssetComparisonParams,
    current_user: User = Depends(get_current_user),
) -> AssetComparisonResponse:
    """Simulate synchronized wealth trajectories and risk metrics across Equities, Gold, and Bank FD."""
    return AssetComparisonService.compare_assets(params)


@router.get(
    "/compare",
    response_model=AssetComparisonResponse,
    summary="Run cross-asset comparison via query parameters",
)
def get_asset_comparison(
    initial_investment: float = Query(100000.0, ge=1000.0, description="Initial lumpsum (INR)"),
    monthly_sip: float = Query(10000.0, ge=0.0, description="Monthly SIP (INR)"),
    time_horizon: TimeHorizon = Query("5Y", description="Horizon (1Y, 3Y, 5Y, 10Y)"),
    fd_rate_override: float = Query(7.1, ge=3.0, le=15.0, description="Bank FD interest rate (%)"),
    inflation_adjusted: bool = Query(False, description="Discount by CPI inflation"),
    current_user: User = Depends(get_current_user),
) -> AssetComparisonResponse:
    """Execute cross-asset simulation with convenient GET query parameters."""
    params = AssetComparisonParams(
        initial_investment=initial_investment,
        monthly_sip=monthly_sip,
        time_horizon=time_horizon,
        fd_rate_override=fd_rate_override,
        inflation_adjusted=inflation_adjusted,
    )
    return AssetComparisonService.compare_assets(params)


@router.get(
    "/rates",
    summary="Current benchmark rates for asset classes",
)
def get_benchmark_rates(
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Retrieve domestic interest rates, gold benchmark price, equity return baseline, and CPI."""
    return {
        "equities_nifty_10y_cagr": 14.5,
        "gold_24k_10y_cagr": 11.2,
        "bank_fd_average_rate": 7.1,
        "rbi_repo_rate": 6.5,
        "cpi_inflation_rate": 5.5,
        "tax_regime": {
            "equity_ltcg": "12.5% (>INR 1.25 Lakh exemption)",
            "gold_ltcg": "12.5% without indexation (>24 months)",
            "fd_interest": "Taxed as per investor income slab",
        },
    }

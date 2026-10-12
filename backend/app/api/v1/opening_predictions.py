"""Endpoints for Next-Day NSE and BSE Opening Price Predictions."""

from fastapi import APIRouter, HTTPException, Path
from app.schemas.opening_prediction import NextDayOpeningQuote, NextDayOpeningOverviewResponse
from app.services.opening_prediction_service import OpeningPredictionService

router = APIRouter()


@router.get("", response_model=NextDayOpeningOverviewResponse, summary="Get Next-Day Opening Price Forecasts for NSE & BSE")
@router.get("/", response_model=NextDayOpeningOverviewResponse, summary="Get Next-Day Opening Price Forecasts for NSE & BSE")
def get_next_day_opening_overview() -> NextDayOpeningOverviewResponse:
    """
    Retrieve Quantile Machine Learning predictions for next-day opening prices
    across major Indian benchmarks (NIFTY 50, BSE SENSEX, Bank NIFTY, NIFTY IT)
    and heavy-weight constituent equities, including gap probabilities and overnight SHAP drivers.
    """
    return OpeningPredictionService.get_overview()


@router.get("/{symbol}", response_model=NextDayOpeningQuote, summary="Get Next-Day Opening Price for specific ticker")
def get_symbol_opening_prediction(
    symbol: str = Path(..., description="Stock or Index symbol, e.g. ^NSEI, ^BSESN, RELIANCE.NS, TCS.NS"),
) -> NextDayOpeningQuote:
    """Retrieve detailed quantile regression opening price intervals and overnight drivers for a single symbol."""
    quote = OpeningPredictionService.get_symbol_opening(symbol)
    if not quote:
        raise HTTPException(
            status_code=404,
            detail=f"Opening prediction not available for symbol '{symbol}'. Try '^NSEI', '^BSESN', or 'RELIANCE.NS'.",
        )
    return quote

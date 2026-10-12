"""Market data endpoints for live NIFTY values, benchmark indices, and intraday charts."""

from typing import Optional
from fastapi import APIRouter, Query

from app.integrations.market_data.market_service import MarketDataService
from app.schemas.market import (
    IndexQuote,
    IndicesOverviewResponse,
    IntradayChartResponse,
    MarketStatusInfo,
)

router = APIRouter()


@router.get("/status", response_model=MarketStatusInfo)
def get_market_status():
    """Get the current live trading session status for Indian exchanges (NSE/BSE)."""
    return MarketDataService.get_market_status()


@router.get("/nifty", response_model=IndexQuote)
def get_nifty_quote():
    """Get real-time / near real-time quote for NIFTY 50 (^NSEI)."""
    return MarketDataService.get_quote("^NSEI")


@router.get("/indices", response_model=IndicesOverviewResponse)
def get_market_indices():
    """Get real-time quotes for major Indian benchmark indices (NIFTY 50, Bank NIFTY, NIFTY IT, Sensex)."""
    return MarketDataService.get_indices()


@router.get("/quote/{symbol}", response_model=IndexQuote)
def get_symbol_quote(symbol: str):
    """Get real-time quote for any specified stock or index symbol."""
    return MarketDataService.get_quote(symbol)


@router.get("/chart", response_model=IntradayChartResponse)
def get_intraday_chart(
    symbol: str = Query("^NSEI", description="Index or stock symbol (e.g. ^NSEI, ^NSEBANK)"),
    interval: str = Query("5m", description="Candle interval (e.g. 1m, 5m, 15m)"),
    period: str = Query("1d", description="Time period (e.g. 1d, 5d)"),
):
    """Retrieve intraday price trend coordinates for sparklines and charts."""
    return MarketDataService.get_intraday_chart(symbol=symbol, interval=interval, period=period)

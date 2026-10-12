from typing import List, Optional
from app.schemas.common import APIBaseModel


class MarketStatusInfo(APIBaseModel):
    """Real-time market session status for Indian exchanges (NSE/BSE)."""
    status: str  # "OPEN", "CLOSED", "PRE_MARKET"
    is_open: bool
    session_label: str  # "Market Open", "Market Closed", "Pre-Market Session"
    current_time_ist: str
    trading_hours: str = "09:15 - 15:30 IST (Mon - Fri)"


class IndexQuote(APIBaseModel):
    """Real-time index quote metadata and performance metrics."""
    symbol: str
    name: str
    current_price: float
    previous_close: float
    change: float
    change_percent: float
    open_price: Optional[float] = None
    day_high: Optional[float] = None
    day_low: Optional[float] = None
    year_high: Optional[float] = None
    year_low: Optional[float] = None
    currency: str = "INR"
    updated_at: str
    market_status: MarketStatusInfo


class IndicesOverviewResponse(APIBaseModel):
    """Collection of major Indian indices quotes."""
    indices: List[IndexQuote]
    market_status: MarketStatusInfo


class IntradayChartPoint(APIBaseModel):
    """Intraday timestamp-price coordinate point for sparklines/charts."""
    time: str
    price: float
    volume: Optional[int] = 0


class IntradayChartResponse(APIBaseModel):
    """Intraday historical points for a given index or stock."""
    symbol: str
    name: str
    interval: str
    currency: str = "INR"
    points: List[IntradayChartPoint]

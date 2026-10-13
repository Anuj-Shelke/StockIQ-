from datetime import date
from typing import List, Optional
from app.schemas.common import APIBaseModel


class PriceHistoryPoint(APIBaseModel):
    """Historical stock price snapshot point."""
    date: date
    open_price: float
    high_price: float
    low_price: float
    close_price: float
    volume: int


class StockItem(APIBaseModel):
    """Stock instrument summary."""
    symbol: str
    name: str
    exchange: str
    sector: Optional[str] = None
    current_price: float
    currency: str = "INR"
    is_active: bool = True


class StockListResponse(APIBaseModel):
    """List response for stocks catalog."""
    total: int
    items: List[StockItem]


class StockDetailResponse(StockItem):
    """Detailed stock response with price history."""
    price_history: List[PriceHistoryPoint] = []

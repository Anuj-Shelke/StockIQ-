from datetime import datetime
from typing import List, Optional
from pydantic import Field
from app.schemas.common import APIBaseModel


class HoldingCreate(APIBaseModel):
    """Payload to add a holding to a portfolio."""
    symbol: str
    asset_type: str = Field(default="stock", pattern="^(stock|gold|fd)$")
    quantity: float = Field(gt=0)
    buy_price: float = Field(ge=0)
    current_price: Optional[float] = None


class HoldingResponse(APIBaseModel):
    """Holding item representation."""
    id: str
    portfolio_id: str
    symbol: str
    asset_type: str
    quantity: float
    buy_price: float
    current_price: float
    created_at: datetime


class PortfolioCreate(APIBaseModel):
    """Payload to create a new portfolio."""
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    holdings: List[HoldingCreate] = []


class PortfolioResponse(APIBaseModel):
    """Portfolio representation."""
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    total_value: float
    holdings: List[HoldingResponse] = []
    created_at: datetime
    updated_at: datetime

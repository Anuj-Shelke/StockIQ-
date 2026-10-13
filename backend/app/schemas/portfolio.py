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


class HoldingUpdate(APIBaseModel):
    """Payload to update an existing holding."""
    quantity: Optional[float] = Field(default=None, gt=0)
    buy_price: Optional[float] = Field(default=None, ge=0)
    current_price: Optional[float] = Field(default=None, ge=0)


class HoldingResponse(APIBaseModel):
    """Holding item representation with valuation and weight metrics."""
    id: str
    portfolio_id: str
    symbol: str
    asset_type: str
    quantity: float
    buy_price: float
    current_price: float
    invested_value: float = 0.0
    current_value: float = 0.0
    gain_loss: float = 0.0
    gain_loss_percent: float = 0.0
    weight_percent: float = 0.0
    created_at: datetime


class PortfolioCreate(APIBaseModel):
    """Payload to create a new portfolio."""
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    holdings: List[HoldingCreate] = []


class PortfolioUpdate(APIBaseModel):
    """Payload to update portfolio metadata."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)


class PortfolioAllocationItem(APIBaseModel):
    """Asset or sector allocation breakdown."""
    category: str
    value: float
    weight_percent: float


class PortfolioResponse(APIBaseModel):
    """Complete portfolio representation with holdings and performance metrics."""
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    total_value: float = 0.0
    total_invested: float = 0.0
    total_gain_loss: float = 0.0
    return_percentage: float = 0.0
    holdings: List[HoldingResponse] = []
    asset_allocation: List[PortfolioAllocationItem] = []
    created_at: datetime
    updated_at: datetime

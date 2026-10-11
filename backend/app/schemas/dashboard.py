from typing import List, Optional
from app.schemas.common import APIBaseModel


class MetricCard(APIBaseModel):
    """Dashboard key performance metric card."""
    title: str
    value: str
    change_percent: Optional[float] = None
    trend: Optional[str] = None  # up, down, neutral
    description: Optional[str] = None


class PortfolioPerformanceItem(APIBaseModel):
    """Portfolio performance overview."""
    portfolio_id: str
    portfolio_name: str
    current_value: float
    invested_value: float
    total_gain_loss: float
    return_percentage: float


class DashboardResponse(APIBaseModel):
    """Consolidated customer dashboard response."""
    metrics: List[MetricCard]
    portfolios: List[PortfolioPerformanceItem]
    recent_activity: List[str] = []

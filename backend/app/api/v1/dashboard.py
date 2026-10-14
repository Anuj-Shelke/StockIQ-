from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.db.session import get_db
from app.integrations.market_data.market_service import MarketDataService
from app.models.portfolio import Portfolio
from app.models.user import User
from app.schemas.dashboard import DashboardResponse, MetricCard, PortfolioPerformanceItem
from app.services.portfolio_service import PortfolioService
from app.core.exceptions import DatabaseUnavailableError

router = APIRouter()


@router.get("", response_model=DashboardResponse)
@router.get("/", response_model=DashboardResponse)
def get_dashboard(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Retrieve consolidated overview metrics and user portfolio performance."""
    user_portfolios = []
    try:
        user_portfolios = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).all()
    except Exception as exc:
        raise DatabaseUnavailableError() from exc

    if user_portfolios:
        responses = [PortfolioService._build_portfolio_response(db, p) for p in user_portfolios]
        portfolio_items = [PortfolioPerformanceItem(
            portfolio_id=p.id,
            portfolio_name=p.name,
            current_value=p.total_value,
            invested_value=p.total_invested,
            total_gain_loss=p.total_gain_loss,
            return_percentage=p.return_percentage,
        ) for p in responses]
        total_val = sum(p.total_value for p in responses)
    else:
        portfolio_items = []
        total_val = 0.0

    # Fetch dynamic real-time NIFTY 50 Benchmark
    try:
        nifty = MarketDataService.get_quote("^NSEI")
        nifty_val = f"{nifty.current_price:,.2f}"
        nifty_change = nifty.change_percent
        nifty_trend = "up" if nifty.change >= 0 else "down"
        nifty_desc = f"NSE benchmark • {nifty.market_status.session_label}"
    except Exception:
        nifty_val = "Unavailable"
        nifty_change = None
        nifty_trend = "neutral"
        nifty_desc = "Benchmark data is temporarily unavailable"

    metrics = [
        MetricCard(
            title="Portfolio Value",
            value=f"₹{total_val:,.2f}",
            change_percent=None,
            trend="neutral",
            description="Overall portfolio valuation across all held assets",
        ),
        MetricCard(
            title="NIFTY 50 Benchmark",
            value=nifty_val,
            change_percent=nifty_change,
            trend=nifty_trend,
            description=nifty_desc,
        ),
        MetricCard(
            title="Gold (10g 24K)",
            value="Unavailable",
            change_percent=None,
            trend="neutral",
            description="Market data is temporarily unavailable",
        ),
        MetricCard(
            title="Portfolio Risk Score",
            value="Unavailable",
            change_percent=None,
            trend="neutral",
            description="Derived from asset volatility and sector concentration",
        ),
    ]

    recent_activity = []

    return DashboardResponse(
        metrics=metrics,
        portfolios=portfolio_items,
        recent_activity=recent_activity,
    )

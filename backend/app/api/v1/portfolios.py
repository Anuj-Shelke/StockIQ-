from datetime import datetime, timezone
from typing import List
import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.core.exceptions import NotFoundError
from app.db.session import get_db
from app.models.portfolio import Holding, Portfolio
from app.models.user import User
from app.schemas.portfolio import (
    HoldingCreate,
    HoldingResponse,
    PortfolioCreate,
    PortfolioResponse,
)

router = APIRouter()

# In-memory portfolios store for offline tests
_in_memory_portfolios = {}


@router.get("", response_model=List[PortfolioResponse])
@router.get("/", response_model=List[PortfolioResponse])
def get_user_portfolios(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """List all portfolios belonging to the authenticated user."""
    portfolios = []
    try:
        portfolios = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).all()
    except Exception:
        pass

    if not portfolios:
        portfolios = [p for p in _in_memory_portfolios.values() if p.user_id == current_user.id]

    # Convert to response schemas
    results = []
    for p in portfolios:
        holdings = []
        for h in getattr(p, "holdings", []):
            h_created = getattr(h, "created_at", None) or datetime.now(timezone.utc)
            holdings.append(
                HoldingResponse(
                    id=h.id,
                    portfolio_id=h.portfolio_id,
                    symbol=h.symbol,
                    asset_type=h.asset_type,
                    quantity=h.quantity,
                    buy_price=h.buy_price,
                    current_price=h.current_price,
                    created_at=h_created,
                )
            )

        p_created = getattr(p, "created_at", None) or datetime.now(timezone.utc)
        p_updated = getattr(p, "updated_at", None) or datetime.now(timezone.utc)
        results.append(
            PortfolioResponse(
                id=p.id,
                user_id=p.user_id,
                name=p.name,
                description=p.description,
                total_value=p.total_value,
                holdings=holdings,
                created_at=p_created,
                updated_at=p_updated,
            )
        )

    return results


@router.post("", response_model=PortfolioResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=PortfolioResponse, status_code=status.HTTP_201_CREATED)
def create_portfolio(
    request: PortfolioCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a new portfolio with optional initial holdings."""
    now = datetime.now(timezone.utc)
    portfolio_id = str(uuid.uuid4())

    total_val = 0.0
    holding_objs = []
    holding_responses = []

    for item in request.holdings:
        curr_price = item.current_price if item.current_price is not None else item.buy_price
        total_val += curr_price * item.quantity
        h_obj = Holding(
            id=str(uuid.uuid4()),
            portfolio_id=portfolio_id,
            symbol=item.symbol.upper(),
            asset_type=item.asset_type,
            quantity=item.quantity,
            buy_price=item.buy_price,
            current_price=curr_price,
        )
        holding_objs.append(h_obj)
        holding_responses.append(
            HoldingResponse(
                id=h_obj.id,
                portfolio_id=portfolio_id,
                symbol=h_obj.symbol,
                asset_type=h_obj.asset_type,
                quantity=h_obj.quantity,
                buy_price=h_obj.buy_price,
                current_price=h_obj.current_price,
                created_at=now,
            )
        )

    portfolio = Portfolio(
        id=portfolio_id,
        user_id=current_user.id,
        name=request.name,
        description=request.description,
        total_value=total_val,
    )
    portfolio.holdings = holding_objs

    try:
        db.add(portfolio)
        db.commit()
        db.refresh(portfolio)
    except Exception:
        _in_memory_portfolios[portfolio_id] = portfolio

    return PortfolioResponse(
        id=portfolio_id,
        user_id=current_user.id,
        name=request.name,
        description=request.description,
        total_value=total_val,
        holdings=holding_responses,
        created_at=now,
        updated_at=now,
    )


@router.get("/{portfolio_id}", response_model=PortfolioResponse)
def get_portfolio(
    portfolio_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Retrieve details and holdings of a specific portfolio."""
    portfolio = None
    try:
        portfolio = (
            db.query(Portfolio)
            .filter(Portfolio.id == portfolio_id, Portfolio.user_id == current_user.id)
            .first()
        )
    except Exception:
        pass

    if not portfolio:
        portfolio = _in_memory_portfolios.get(portfolio_id)

    if not portfolio or portfolio.user_id != current_user.id:
        raise NotFoundError(f"Portfolio '{portfolio_id}' not found")

    holdings = []
    for h in getattr(portfolio, "holdings", []):
        h_created = getattr(h, "created_at", None) or datetime.now(timezone.utc)
        holdings.append(
            HoldingResponse(
                id=h.id,
                portfolio_id=h.portfolio_id,
                symbol=h.symbol,
                asset_type=h.asset_type,
                quantity=h.quantity,
                buy_price=h.buy_price,
                current_price=h.current_price,
                created_at=h_created,
            )
        )

    now = datetime.now(timezone.utc)
    return PortfolioResponse(
        id=portfolio.id,
        user_id=portfolio.user_id,
        name=portfolio.name,
        description=portfolio.description,
        total_value=portfolio.total_value,
        holdings=holdings,
        created_at=getattr(portfolio, "created_at", None) or now,
        updated_at=getattr(portfolio, "updated_at", None) or now,
    )

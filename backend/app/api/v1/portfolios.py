"""Portfolio management API endpoints."""

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.portfolio import (
    HoldingCreate,
    HoldingResponse,
    HoldingUpdate,
    PortfolioCreate,
    PortfolioResponse,
    PortfolioUpdate,
)
from app.services.portfolio_service import PortfolioService

router = APIRouter()


@router.get("", response_model=List[PortfolioResponse])
@router.get("/", response_model=List[PortfolioResponse])
def get_user_portfolios(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """List all portfolios owned by the authenticated user."""
    return PortfolioService.list_portfolios(db=db, user_id=str(current_user.id))


@router.post("", response_model=PortfolioResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=PortfolioResponse, status_code=status.HTTP_201_CREATED)
def create_portfolio(
    request: PortfolioCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a new portfolio with optional initial holdings."""
    return PortfolioService.create_portfolio(db=db, user_id=str(current_user.id), request=request)


@router.get("/{portfolio_id}", response_model=PortfolioResponse)
def get_portfolio(
    portfolio_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Retrieve details, valuations, and asset allocations of a specific portfolio."""
    return PortfolioService.get_portfolio(db=db, portfolio_id=portfolio_id, user_id=str(current_user.id))


@router.put("/{portfolio_id}", response_model=PortfolioResponse)
@router.patch("/{portfolio_id}", response_model=PortfolioResponse)
def update_portfolio(
    portfolio_id: str,
    request: PortfolioUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update name or description of an existing portfolio."""
    return PortfolioService.update_portfolio(
        db=db, portfolio_id=portfolio_id, user_id=str(current_user.id), request=request
    )


@router.delete("/{portfolio_id}", status_code=status.HTTP_200_OK)
def delete_portfolio(
    portfolio_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete a portfolio and all its holdings."""
    PortfolioService.delete_portfolio(db=db, portfolio_id=portfolio_id, user_id=str(current_user.id))
    return {"success": True, "message": f"Portfolio '{portfolio_id}' successfully deleted"}


# ---------------- Holdings Management Endpoints ----------------


@router.post("/{portfolio_id}/holdings", response_model=HoldingResponse, status_code=status.HTTP_201_CREATED)
def add_holding(
    portfolio_id: str,
    request: HoldingCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Add a new stock or asset holding to the portfolio."""
    return PortfolioService.add_holding(
        db=db, portfolio_id=portfolio_id, user_id=str(current_user.id), request=request
    )


@router.put("/{portfolio_id}/holdings/{holding_id}", response_model=HoldingResponse)
@router.patch("/{portfolio_id}/holdings/{holding_id}", response_model=HoldingResponse)
def update_holding(
    portfolio_id: str,
    holding_id: str,
    request: HoldingUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update quantity, buy price, or market price of an existing holding."""
    return PortfolioService.update_holding(
        db=db,
        portfolio_id=portfolio_id,
        holding_id=holding_id,
        user_id=str(current_user.id),
        request=request,
    )


@router.delete("/{portfolio_id}/holdings/{holding_id}", status_code=status.HTTP_200_OK)
def delete_holding(
    portfolio_id: str,
    holding_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Remove a holding from the portfolio."""
    PortfolioService.delete_holding(
        db=db, portfolio_id=portfolio_id, holding_id=holding_id, user_id=str(current_user.id)
    )
    return {"success": True, "message": f"Holding '{holding_id}' removed from portfolio"}

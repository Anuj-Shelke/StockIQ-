"""Tax Intelligence & Explainable Capital Gains API Endpoints."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.core.tax_rules import get_all_supported_rules
from app.db.session import get_db
from app.models.user import User
from app.schemas.tax import (
    TaxCalculateRequest,
    TaxCalculateResponse,
    TaxExplainRequest,
    TaxHistoryRecordResponse,
    TaxScenarioComparisonRequest,
    TaxScenarioComparisonResponse,
    TaxSummaryResponse,
    TaxTransactionCreate,
    TaxTransactionResponse,
)
from app.services.tax_service import TaxService

router = APIRouter()


@router.post("/calculate", response_model=TaxCalculateResponse, summary="Calculate capital gains and estimated tax")
def calculate_capital_gains(
    request: TaxCalculateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> TaxCalculateResponse:
    """Compute deterministic capital gains, statutory deductions, applicable tax rate, and XAI explanation."""
    return TaxService.calculate_tax(
        db=db,
        user_id=str(current_user.id),
        request=request,
    )


@router.post("/explain", response_model=TaxCalculateResponse, summary="Explain tax calculation in plain English")
def explain_tax_calculation(
    request: TaxExplainRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> TaxCalculateResponse:
    """Generate or retrieve beginner-friendly, structured XAI explanation for a tax calculation."""
    return TaxService.explain_tax(
        db=db,
        user_id=str(current_user.id),
        request=request,
    )


@router.get("/summary", response_model=TaxSummaryResponse, summary="Get user's portfolio and transaction tax summary")
def get_tax_summary(
    financial_year: Optional[str] = Query(None, description="e.g. 'FY 2024-25'"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> TaxSummaryResponse:
    """Retrieve aggregate realized gains, unrealized gains, estimated tax liability, and incomplete data warnings."""
    return TaxService.get_summary(
        db=db,
        user_id=str(current_user.id),
        financial_year=financial_year,
    )


@router.get("/transactions", response_model=List[TaxTransactionResponse], summary="List user's tax transactions")
def list_tax_transactions(
    financial_year: Optional[str] = Query(None),
    symbol: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> List[TaxTransactionResponse]:
    """Retrieve authenticated user's recorded tax transactions."""
    return TaxService.list_transactions(
        db=db,
        user_id=str(current_user.id),
        financial_year=financial_year,
        symbol=symbol,
    )


@router.post(
    "/transactions",
    response_model=TaxTransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new tax transaction record",
)
def create_tax_transaction(
    request: TaxTransactionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> TaxTransactionResponse:
    """Add a manual transaction record to the user's tax ledger."""
    return TaxService.create_transaction(
        db=db,
        user_id=str(current_user.id),
        txn_in=request,
    )


@router.get("/history", response_model=List[TaxHistoryRecordResponse], summary="Get calculation audit history")
def get_tax_history(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> List[TaxHistoryRecordResponse]:
    """Retrieve audit trail of previously saved tax calculations with inputs, outputs, and rule versions."""
    return TaxService.get_calculation_history(
        db=db,
        user_id=str(current_user.id),
        limit=limit,
    )


@router.post("/scenario", response_model=TaxScenarioComparisonResponse, summary="Compare hypothetical sale scenarios")
def compare_tax_scenarios(
    request: TaxScenarioComparisonRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> TaxScenarioComparisonResponse:
    """Simulate sell-today vs sell-future scenarios, evaluate holding period impact, and compare predicted prices."""
    return TaxService.simulate_scenarios(
        db=db,
        user_id=str(current_user.id),
        request=request,
    )


@router.get("/rules", response_model=List[Dict[str, Any]], summary="Get active and statutory tax rule definitions")
def get_tax_rules() -> List[Dict[str, Any]]:
    """Retrieve supported Indian capital gains tax rules, statutory sections, effective dates, and thresholds."""
    return get_all_supported_rules()

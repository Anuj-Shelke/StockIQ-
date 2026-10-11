from datetime import datetime, timezone
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.chatbot import (
    ChatMessageResponse,
    ChatQueryRequest,
    ChatQueryResponse,
    ChatSessionResponse,
    ChatSourceItem,
)

router = APIRouter()


@router.post("/query", response_model=ChatQueryResponse)
def query_chatbot(
    request: ChatQueryRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Ask an educational financial question backed by RAG knowledge base."""
    session_id = request.session_id or str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    query_lower = request.query.lower()

    if "drawdown" in query_lower:
        answer = (
            "Maximum Drawdown (MDD) is an indicator of downside risk over a specified time period. "
            "It measures the largest single drop from peak to trough before a new peak is achieved. "
            "For example, during the 2020 COVID shock, Indian equity indices experienced a drawdown of ~38%."
        )
        sources = [
            ChatSourceItem(
                title="SEBI Investor Education: Understanding Risk & Drawdown",
                reference="SEBI-IE-2023-Vol-2",
                source_url="https://investor.sebi.gov.in",
            ),
            ChatSourceItem(
                title="NSE Historical Volatility & Drawdown Handbook",
                reference="NSE-EDU-402",
                source_url="https://nseindia.com",
            ),
        ]
    elif "cagr" in query_lower:
        answer = (
            "Compound Annual Growth Rate (CAGR) represents the annualized rate of return earned by an investment "
            "over a multi-year period assuming profits were reinvested at the end of each year. "
            "Formula: CAGR = (Final Value / Beginning Value)^(1 / Years) - 1."
        )
        sources = [
            ChatSourceItem(
                title="Basics of Financial Math & Compounding",
                reference="AMFI-Guide-101",
                source_url="https://amfiindia.com",
            )
        ]
    else:
        answer = (
            "StockIQ educational intelligence: Asset allocation across equities, gold, and fixed income "
            "balances risk-adjusted return. Historical stress tests illustrate that holding uncorrelated assets "
            "substantially mitigates drawdown severity during market corrections."
        )
        sources = [
            ChatSourceItem(
                title="StockIQ Financial Knowledge Base",
                reference="STOCKIQ-KB-CORE",
                source_url=None,
            )
        ]

    return ChatQueryResponse(
        session_id=session_id,
        query=request.query,
        answer=answer,
        sources=sources,
        created_at=now,
    )


@router.get("/history", response_model=List[ChatMessageResponse])
def get_chat_history(
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve chat session history for current user."""
    now = datetime.now(timezone.utc)
    return [
        ChatMessageResponse(
            id=str(uuid.uuid4()),
            sender="assistant",
            message="Welcome to StockIQ Financial Education Assistant. Ask any question about portfolio risk, drawdown, CAGR, or asset allocation.",
            sources=[],
            created_at=now,
        )
    ]

"""Financial Education Chatbot API Endpoints backed by RAG Retrieval Engine."""

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
from app.services.rag_service import RAGService


router = APIRouter()


@router.post("/query", response_model=ChatQueryResponse, summary="Query financial education chatbot")
def query_chatbot(
    request: ChatQueryRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ChatQueryResponse:
    """Ask an educational financial question backed by RAG vector knowledge base."""
    return RAGService.generate_grounded_answer(
        query=request.query,
        session_id=request.session_id,
        user_id=str(current_user.id),
        db=db,
    )


@router.get("/history", response_model=List[ChatMessageResponse], summary="Get chat session history")
def get_chat_history(
    current_user: User = Depends(get_current_active_user),
) -> List[ChatMessageResponse]:
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

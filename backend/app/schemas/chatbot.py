from datetime import datetime
from typing import List, Optional
from pydantic import Field
from app.schemas.common import APIBaseModel


class ChatQueryRequest(APIBaseModel):
    """Payload to send an educational query to the chatbot."""
    session_id: Optional[str] = None
    query: str = Field(min_length=1, max_length=1000)


class ChatSourceItem(APIBaseModel):
    """Source reference for RAG educational answer."""
    title: str
    source_url: Optional[str] = None
    reference: str


class ChatMessageResponse(APIBaseModel):
    """Individual chat message item."""
    id: str
    sender: str
    message: str
    sources: List[ChatSourceItem] = []
    created_at: datetime


class ChatQueryResponse(APIBaseModel):
    """Response returned for a chatbot query."""
    session_id: str
    query: str
    answer: str
    sources: List[ChatSourceItem] = []
    created_at: datetime


class ChatSessionResponse(APIBaseModel):
    """Chat session metadata and recent messages."""
    id: str
    title: str
    messages: List[ChatMessageResponse] = []
    created_at: datetime

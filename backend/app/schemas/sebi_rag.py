"""Pydantic schemas for SEBI Regulatory Guidelines RAG Chatbot."""

from datetime import datetime
from typing import Dict, List, Optional
from pydantic import Field
from app.schemas.common import APIBaseModel


class SebiQueryRequest(APIBaseModel):
    """User query submitted to the SEBI Compliance RAG Chatbot."""
    query: str = Field(..., min_length=3, max_length=1000, description="Question regarding SEBI rules or guidelines")
    session_id: Optional[str] = Field(default=None, description="Optional conversational session ID")
    category: Optional[str] = Field(default=None, description="Filter by regulatory category")


class SebiSourceCitation(APIBaseModel):
    """Statutory citation grounding the RAG response."""
    doc_id: str
    title: str
    section: str
    circular_no: str
    official_url: str
    excerpt: str
    relevance_score: float


class SebiQueryResponse(APIBaseModel):
    """Grounded regulatory answer synthesized by RAG pipeline."""
    query: str
    answer: str
    citations: List[SebiSourceCitation]
    statutory_disclaimer: str
    session_id: str
    timestamp: datetime


class SebiDocumentSection(APIBaseModel):
    """Section summary of an installed SEBI document."""
    section: str
    summary: str


class SebiDocumentItem(APIBaseModel):
    """Installed regulatory document metadata."""
    doc_id: str
    title: str
    category: str
    circular_no: str
    effective_date: str
    official_url: str
    section_count: int
    sections: List[SebiDocumentSection]

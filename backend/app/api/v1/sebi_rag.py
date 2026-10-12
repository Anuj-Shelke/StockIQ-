"""API Endpoints for SEBI Guidelines RAG Chatbot and Document Explorer."""

from typing import List, Dict
from fastapi import APIRouter
from app.schemas.sebi_rag import (
    SebiQueryRequest,
    SebiQueryResponse,
    SebiDocumentItem,
)
from app.services.sebi_rag_service import SebiRagService

router = APIRouter()


@router.post("/chat", response_model=SebiQueryResponse, summary="Query the SEBI Regulatory Guidelines RAG Chatbot")
def query_sebi_chatbot(request: SebiQueryRequest) -> SebiQueryResponse:
    """
    Submit a query regarding Indian securities law, investor suitability,
    insider trading, advisory fee caps, or fraud prevention to the SEBI RAG Chatbot.
    Returns source-grounded answers citing official regulations and circulars.
    """
    return SebiRagService.answer_query(request)


@router.get("/documents", response_model=List[SebiDocumentItem], summary="List all installed statutory SEBI documents")
def get_installed_sebi_documents() -> List[SebiDocumentItem]:
    """Retrieve full catalog of installed SEBI regulations, gazettes, and compliance rulebooks."""
    return SebiRagService.list_installed_documents()


@router.get("/sample-queries", response_model=List[Dict[str, str]], summary="Get curated SEBI compliance query prompts")
def get_sample_queries() -> List[Dict[str, str]]:
    """Get high-frequency compliance and investor protection questions for quick testing."""
    return [
        {
            "category": "Investment Advisory",
            "query": "What are the mandatory risk profiling requirements under SEBI (Investment Advisers) Regulations?",
        },
        {
            "category": "Fee Limits",
            "query": "What is the maximum fee an Investment Adviser can charge a client under SEBI rules?",
        },
        {
            "category": "Insider Trading",
            "query": "What constitutes Unpublished Price Sensitive Information (UPSI) under SEBI PIT Regulations?",
        },
        {
            "category": "Market Fraud",
            "query": "What practices are prohibited under SEBI PFUTP regulations regarding stock tips and pump-and-dump?",
        },
        {
            "category": "Dispute Redressal",
            "query": "What is the timeline for resolving investor grievances on SEBI SCORES 2.0 and SMART ODR?",
        },
        {
            "category": "AI & Algorithmic Trading",
            "query": "What are SEBI's guidelines for deploying AI/ML models and algorithms in stock recommendations?",
        },
    ]

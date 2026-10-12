"""Unit tests for SEBI Regulatory Guidelines RAG Chatbot service and endpoints."""

import pytest
from app.schemas.sebi_rag import SebiQueryRequest
from app.services.sebi_rag_service import SebiRagService


def test_list_installed_sebi_documents():
    """Verify that authoritative SEBI rulebooks and circulars are installed."""
    docs = SebiRagService.list_installed_documents()
    assert len(docs) >= 5

    doc_ids = [d.doc_id for d in docs]
    assert "SEBI-IA-2013" in doc_ids
    assert "SEBI-PIT-2015" in doc_ids
    assert "SEBI-PFUTP-2003" in doc_ids
    assert "SEBI-SCORES-2024" in doc_ids
    assert "SEBI-AI-ML-2024" in doc_ids

    for d in docs:
        assert d.title
        assert d.official_url.startswith("http")
        assert d.section_count > 0


def test_sebi_rag_query_risk_profiling():
    """Verify query on risk profiling returns grounded citations from IA 2013."""
    req = SebiQueryRequest(query="What is mandatory for investor risk profiling under SEBI IA regulations?")
    res = SebiRagService.answer_query(req)

    assert res.query == req.query
    assert "SEBI" in res.answer
    assert "Risk Profiling" in res.answer or "Regulation 17" in res.answer or "suitability" in res.answer.lower()
    assert len(res.citations) >= 1
    assert any("SEBI-IA-2013" == c.doc_id for c in res.citations)


def test_sebi_rag_query_insider_trading():
    """Verify query on UPSI returns citation from PIT Regulations 2015."""
    req = SebiQueryRequest(query="What constitutes UPSI and what is the rule under insider trading regulations?")
    res = SebiRagService.answer_query(req)

    assert "UPSI" in res.answer or "Price Sensitive" in res.answer
    assert len(res.citations) >= 1
    assert any("SEBI-PIT-2015" == c.doc_id for c in res.citations)


def test_sebi_rag_query_scores_resolution_timeline():
    """Verify query on investor complaint resolution returns 21 calendar days mandate."""
    req = SebiQueryRequest(query="What is the timeline for resolving complaints on SCORES 2.0?")
    res = SebiRagService.answer_query(req)

    assert "21" in res.answer
    assert "SCORES" in res.answer

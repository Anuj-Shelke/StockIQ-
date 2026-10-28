"""Unit tests for Vector Knowledge Base, RAG Retrieval, and Education API."""

import pytest
from app.integrations.vector_store.embeddings import EmbeddingGenerator
from app.integrations.vector_store.pgvector_store import PGVectorStore
from app.services.rag_service import RAGService


def test_embedding_generator_and_cosine_similarity():
    """Verify vector dimensionality and math properties."""
    vec1 = EmbeddingGenerator.get_embedding("What is Maximum Drawdown in stock market?")
    assert len(vec1) == 384
    sim_self = EmbeddingGenerator.cosine_similarity(vec1, vec1)
    assert round(sim_self, 2) == 1.0

    vec2 = EmbeddingGenerator.get_embedding("Drawdown peak to trough decline")
    sim_related = EmbeddingGenerator.cosine_similarity(vec1, vec2)
    assert sim_related > 0.0


def test_vector_store_semantic_search():
    """Verify hybrid vector retrieval against SEBI / NISM corpus."""
    store = PGVectorStore()
    results = store.search(query="How does CAGR measure compound growth?", top_k=2)
    assert len(results) > 0
    top_doc = results[0]
    assert "CAGR" in top_doc["text"] or "NISM" in top_doc["title"] or "SEBI" in top_doc["publisher"]


def test_rag_service_grounded_answer():
    """Verify RAGService produces grounded answers and source citations."""
    resp = RAGService.generate_grounded_answer(query="What is LTCG tax on listed equities?")
    assert resp.answer is not None
    assert len(resp.sources) > 0
    assert any("Income Tax" in s.reference or "SEBI" in s.reference for s in resp.sources)


def test_chatbot_and_education_endpoints(client, auth_headers):
    """Verify REST API endpoints for chatbot and education."""
    # 1. POST /api/v1/chatbot/query
    chat_res = client.post(
        "/api/v1/chatbot/query",
        json={"query": "Explain Maximum Drawdown and recovery"},
        headers=auth_headers,
    )
    assert chat_res.status_code == 200
    c_data = chat_res.json()
    assert "drawdown" in c_data["answer"].lower()
    assert len(c_data["sources"]) > 0

    # 2. GET /api/v1/education/glossary
    gloss_res = client.get("/api/v1/education/glossary", headers=auth_headers)
    assert gloss_res.status_code == 200
    terms = [item["term"] for item in gloss_res.json()]
    assert "CAGR" in terms
    assert "Max Drawdown" in terms

    # 3. GET /api/v1/education/sources
    src_res = client.get("/api/v1/education/sources", headers=auth_headers)
    assert src_res.status_code == 200
    assert len(src_res.json()) >= 4

    # 4. POST /api/v1/education/calculator (SIP)
    sip_res = client.post(
        "/api/v1/education/calculator",
        json={"calculator_type": "sip", "monthly_sip": 10000.0, "rate": 12.0, "tenure_years": 5.0},
        headers=auth_headers,
    )
    assert sip_res.status_code == 200
    sip_data = sip_res.json()
    assert len(sip_data["results"]) == 3

    # 5. POST /api/v1/education/calculator (Drawdown)
    dd_res = client.post(
        "/api/v1/education/calculator",
        json={"calculator_type": "drawdown", "peak_value": 100000.0, "trough_value": 75000.0},
        headers=auth_headers,
    )
    assert dd_res.status_code == 200
    assert "-25.00%" in dd_res.json()["results"][2]["value"]

    # 6. POST /api/v1/education/chat
    edu_chat = client.post(
        "/api/v1/education/chat",
        json={"query": "Why should I diversify into gold?"},
        headers=auth_headers,
    )
    assert edu_chat.status_code == 200
    assert edu_chat.json()["sender"] == "assistant"
    assert len(edu_chat.json()["sources"]) > 0


def test_rag_minimum_age_query_grounding():
    """Verify that asking minimum age to invest in stock returns 18 years and depository grounding."""
    resp = RAGService.generate_grounded_answer(query="what is the minimum age to invest in stock")
    assert resp.answer is not None
    assert "18" in resp.answer
    assert "minor" in resp.answer.lower() or "guardian" in resp.answer.lower() or "demat" in resp.answer.lower()
    assert len(resp.sources) > 0


def test_education_chat_unauthenticated_minimum_age(client):
    """Verify /education/chat works without mandatory authentication (guest access) and answers age query."""
    res = client.post(
        "/api/v1/education/chat",
        json={"query": "what is the minimum age to invest in stock"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["sender"] == "assistant"
    assert "18" in body["content"]
    assert len(body["sources"]) > 0


def test_out_of_domain_query_rejection(client):
    """Verify that non-financial queries like 'how to make a coffee' are politely rejected without hallucination."""
    res = client.post(
        "/api/v1/education/chat",
        json={"query": "how to make a coffee"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["sender"] == "assistant"
    assert "outside the scope" in body["content"].lower() or "outside of this financial domain" in body["content"].lower()



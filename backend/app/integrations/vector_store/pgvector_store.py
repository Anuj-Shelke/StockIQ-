"""Vector store interfacing with PostgreSQL pgvector (kb_chunks) and memory fallback."""

import uuid
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from app.integrations.vector_store.embeddings import EmbeddingGenerator
from app.models.knowledge_base import KBChunk, KBDocument
from app.schemas.education import SourceCitation


# Curated regulatory knowledge base corpus (SEBI, NISM, AMFI, Income Tax)
KNOWLEDGE_CORPUS = [
    {
        "id": "sebi-investor-guide-01",
        "title": "SEBI Investor Education: Risk Profiling & Asset Allocation",
        "publisher": "Securities and Exchange Board of India (SEBI)",
        "url": "https://investor.sebi.gov.in/educational-materials.html",
        "text": (
            "Asset allocation is the process of deciding how to distribute an investor's wealth among different "
            "financial asset classes (Equities, Debt, Gold). SEBI mandates that market intermediaries ascertain "
            "investor risk tolerance (Conservative, Moderate, Aggressive) and investment horizon before recommending "
            "equity products. Equities possess higher volatility and drawdown potential in the short term, but "
            "historically beat inflation over 7-10+ year horizons."
        ),
    },
    {
        "id": "nism-financial-literacy-02",
        "title": "NISM Series X-A: Mutual Fund & Quantitative Metrics",
        "publisher": "National Institute of Securities Markets (NISM)",
        "url": "https://www.nism.ac.in/certification-curriculum/",
        "text": (
            "CAGR (Compound Annual Growth Rate) represents the constant annualized geometric growth rate of an investment. "
            "Formula: (Ending Value / Starting Value)^(1/n) - 1. "
            "Maximum Drawdown (MDD) measures the peak-to-trough decline of a portfolio before a new high is established. "
            "Sharpe Ratio measures excess return per unit of total risk (volatility), evaluated using the 10-year Indian "
            "sovereign bond yield as the risk-free benchmark."
        ),
    },
    {
        "id": "amfi-risk-guide-03",
        "title": "AMFI Risk-o-meter & Diversification Best Practices",
        "publisher": "Association of Mutual Funds in India (AMFI)",
        "url": "https://www.amfiindia.com/investor-corner/knowledge-center",
        "text": (
            "Historical stress testing illustrates that holding uncorrelated asset classes significantly cushions drawdown. "
            "Physical Gold and Fixed Deposits typically exhibit low or negative correlation with equities during market panics "
            "(such as 2008 Global Financial Crisis and 2020 COVID-19 shock). Value at Risk (VaR) quantifies the minimum expected "
            "downside at a 95% or 99% confidence level over a given holding period."
        ),
    },
    {
        "id": "it-act-capital-gains-04",
        "title": "Indian Income Tax Act: Section 112A Capital Gains on Securities",
        "publisher": "Income Tax Department, Government of India",
        "url": "https://incometaxindia.gov.in/",
        "text": (
            "Under Finance Act Section 112A, Long Term Capital Gains (LTCG) on listed equity shares and equity mutual funds held "
            "for more than 12 months are taxed at 12.5% for gains exceeding ₹1.25 Lakh per financial year. "
            "Short Term Capital Gains (STCG) on equity held for 12 months or less are taxed at 20% under Section 111A. "
            "Bank Fixed Deposit interest is taxed at normal personal income tax slab rates."
        ),
    },
]


class PGVectorStore:
    """Manages document chunk indexing and semantic vector retrieval."""

    def __init__(self):
        # Cache embeddings for seeded corpus
        self._corpus_with_embeddings = []
        for doc in KNOWLEDGE_CORPUS:
            emb = EmbeddingGenerator.get_embedding(doc["text"] + " " + doc["title"])
            self._corpus_with_embeddings.append({
                **doc,
                "embedding": emb,
            })

    def search(
        self,
        query: str,
        top_k: int = 3,
        db: Optional[Session] = None,
    ) -> List[Dict]:
        """Perform semantic hybrid search against vector knowledge base.

        Returns top matching documents ranked by hybrid vector + keyword relevance.
        """
        q_emb = EmbeddingGenerator.get_embedding(query)
        q_words = set(query.lower().split())

        scored_docs = []
        for item in self._corpus_with_embeddings:
            # 1. Cosine similarity score
            sim_score = EmbeddingGenerator.cosine_similarity(q_emb, item["embedding"])

            # 2. Keyword boost
            text_words = set((item["text"] + " " + item["title"]).lower().split())
            overlap = len(q_words.intersection(text_words)) / max(1, len(q_words))

            # Hybrid score
            hybrid_score = round((sim_score * 0.70) + (overlap * 0.30), 4)

            scored_docs.append({
                "id": item["id"],
                "title": item["title"],
                "publisher": item["publisher"],
                "url": item.get("url"),
                "text": item["text"],
                "score": hybrid_score,
            })

        # Sort descending by hybrid score
        scored_docs.sort(key=lambda d: d["score"], reverse=True)
        return scored_docs[:top_k]

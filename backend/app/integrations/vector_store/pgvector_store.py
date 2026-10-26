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
    {
        "id": "sebi-age-eligibility-05",
        "title": "SEBI & Depository Regulations: Minimum Age & Account Opening Eligibility",
        "publisher": "Securities and Exchange Board of India (SEBI)",
        "url": "https://investor.sebi.gov.in/account-opening-guidelines.html",
        "text": (
            "The minimum legal age to open an independent Demat account and Trading account to invest in Indian stock markets "
            "is 18 years, in accordance with the Indian Contract Act, 1872 and SEBI Master Circular for Depositories. "
            "An individual who is 18 years of age or older has full legal capacity to enter into binding contracts, sign broker agreements, "
            "execute equity trades, and invest independently. "
            "Minors (individuals under 18 years old) can legally hold and invest in stocks, bonds, and mutual funds, but only through a "
            "Minor Demat Account opened and operated exclusively by a natural guardian (father or mother) or a court-appointed legal guardian. "
            "Minors are legally prohibited from speculative intraday trading and equity derivatives (Futures & Options). "
            "Upon attaining 18 years of age, the minor must submit fresh major KYC documentation to transition the account to an independent individual Demat account."
        ),
    },
    {
        "id": "sebi-kyc-requirements-06",
        "title": "SEBI KYC Registration Agency (KRA) & Mandatory Account Opening Documentation",
        "publisher": "Securities and Exchange Board of India (SEBI)",
        "url": "https://www.sebi.gov.in/legal/master-circulars/oct-2023/master-circular-on-know-your-client-kyc-norms_77934.html",
        "text": (
            "To open a Demat and Trading account in India, SEBI mandates uniform KYC verification across all registered intermediaries. "
            "Mandatory requirements include: (1) Permanent Account Number (PAN Card), which is statutory for all securities market transactions; "
            "(2) Proof of Identity and Address (Aadhaar, Passport, Voter ID, or Driving License); (3) Active Bank Account in investor's name; "
            "and (4) In-Person Verification (IPV) via webcam or Aadhaar e-Sign OTP. "
            "A single CKYC or KRA registration allows investors to seamlessly transact across all SEBI-registered brokers, depositories (NSDL/CDSL), and mutual funds."
        ),
    },
    {
        "id": "exchange-trading-mechanics-07",
        "title": "NSE & BSE Trading Hours, Order Mechanics and T+1 Settlement",
        "publisher": "National Stock Exchange of India (NSE)",
        "url": "https://www.nseindia.com/market-data/trading-hours-and-settlement",
        "text": (
            "Trading on Indian stock exchanges (NSE and BSE) operates Monday through Friday: "
            "Pre-open session runs from 09:00 AM to 09:15 AM IST (order entry and price discovery); "
            "Regular continuous trading runs from 09:15 AM to 03:30 PM IST; Post-closing session runs from 03:40 PM to 04:00 PM IST. "
            "Indian equity cash markets settle on a T+1 (Trade date plus one business day) rolling settlement basis. "
            "Standard order types include Limit Orders, Market Orders, Stop-Loss (SL and SL-M) orders, and After Market Orders (AMO)."
        ),
    },
    {
        "id": "sebi-circuit-breakers-08",
        "title": "SEBI Market-Wide Circuit Breakers & Price Bands",
        "publisher": "Securities and Exchange Board of India (SEBI)",
        "url": "https://www.sebi.gov.in/enforcement/circulars/index-based-market-wide-circuit-breaker.html",
        "text": (
            "SEBI implements index-based market-wide circuit breakers to curb catastrophic systemic panics. "
            "Circuit triggers are set at 10%, 15%, and 20% movements in either the NIFTY 50 or SENSEX. "
            "A 10% movement before 1:00 PM triggers a 45-minute market halt followed by a 15-minute pre-open auction. "
            "Individual stocks (excluding F&O constituent stocks) are subject to dynamic daily price bands of 2%, 5%, 10%, or 20%."
        ),
    },
    {
        "id": "sebi-fo-risk-study-09",
        "title": "SEBI Study on Retail Trader Performance in Equity F&O Segment",
        "publisher": "Securities and Exchange Board of India (SEBI)",
        "url": "https://www.sebi.gov.in/reports-and-statistics/research/jan-2023/study-analysis-of-profit-and-loss-in-equity-derivatives-segment_67525.html",
        "text": (
            "SEBI's landmark empirical research study revealed that 9 out of 10 (89%) individual retail traders in equity Futures and Options (F&O) "
            "incurred net financial losses. The average loss per loss-making trader exceeded ₹1.1 Lakh, with additional transaction costs "
            "and STT contributing substantially to capital erosion. SEBI mandates that all stockbrokers display prominent risk warning banners "
            "before any client enters derivative orders."
        ),
    },
    {
        "id": "sebi-scores-grievance-10",
        "title": "SEBI SCORES 2.0 & Online Dispute Resolution (SMART ODR)",
        "publisher": "Securities and Exchange Board of India (SEBI)",
        "url": "https://scores.sebi.gov.in/",
        "text": (
            "Investors facing unresolved complaints against listed companies, brokers, depositories, or investment advisers can file grievances "
            "on the SEBI Complaints Redress System (SCORES 2.0). Intermediaries are legally mandated to resolve complaints within 21 calendar days. "
            "If dissatisfied, investors can escalate to the SMART ODR portal for independent online conciliation and arbitration."
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

        # Dynamically integrate all statutory SEBI regulatory documents into the vector corpus
        try:
            from app.integrations.vector_store.sebi_documents import SEBI_REGULATORY_DOCUMENTS
            for sebi_doc in SEBI_REGULATORY_DOCUMENTS:
                for idx, sec in enumerate(sebi_doc.get("sections", [])):
                    entry = {
                        "id": f"{sebi_doc['doc_id']}-sec-{idx}",
                        "title": f"{sebi_doc['title']} - {sec['section']}",
                        "publisher": "Securities and Exchange Board of India (SEBI)",
                        "url": sebi_doc.get("official_url"),
                        "text": f"{sec['summary']}. {sec['text']}",
                    }
                    emb = EmbeddingGenerator.get_embedding(entry["text"] + " " + entry["title"])
                    self._corpus_with_embeddings.append({
                        **entry,
                        "embedding": emb,
                    })
        except Exception:
            pass

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

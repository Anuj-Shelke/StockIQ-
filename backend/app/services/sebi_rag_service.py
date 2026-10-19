"""SEBI Regulatory Retrieval-Augmented Generation (RAG) Service."""

from datetime import datetime, timezone
import re
import uuid
from typing import Dict, List, Optional
from app.integrations.vector_store.sebi_documents import SEBI_REGULATORY_DOCUMENTS
from app.schemas.sebi_rag import (
    SebiQueryRequest,
    SebiQueryResponse,
    SebiSourceCitation,
    SebiDocumentItem,
    SebiDocumentSection,
)


class SebiRagService:
    """Service retrieving SEBI rulebooks and synthesizing grounded compliance answers."""

    @classmethod
    def list_installed_documents(cls) -> List[SebiDocumentItem]:
        """List all statutory SEBI documents loaded into the vector index."""
        result: List[SebiDocumentItem] = []
        for doc in SEBI_REGULATORY_DOCUMENTS:
            sections = [
                SebiDocumentSection(section=s["section"], summary=s["summary"])
                for s in doc["sections"]
            ]
            result.append(
                SebiDocumentItem(
                    doc_id=doc["doc_id"],
                    title=doc["title"],
                    category=doc["category"],
                    circular_no=doc.get("circular_no", "N/A"),
                    effective_date=doc.get("effective_date", "Gazette Published"),
                    official_url=doc["official_url"],
                    section_count=len(sections),
                    sections=sections,
                )
            )
        return result

    @classmethod
    def search_sebi_corpus(cls, query: str, top_k: int = 3, category: Optional[str] = None) -> List[Dict]:
        """Rank chunks by actual query coverage; never promote unrelated chunks."""
        stopwords = {
            "what", "which", "who", "when", "where", "why", "is", "the", "to", "in", "and", "a", "an",
            "of", "for", "on", "with", "or", "how", "can", "does", "are", "do", "about", "under",
            "sebi", "regulation", "regulations", "rule", "rules", "guideline", "guidelines",
        }

        def tokens(value: str) -> set[str]:
            result = set()
            for token in re.findall(r"[a-z0-9]+", value.lower()):
                if token in stopwords or len(token) < 3:
                    continue
                # Small normalization handles common question/corpus inflections.
                token = re.sub(r"(ies|ing|ed|s)$", "", token)
                result.add(token)
            return result

        original_query_tokens = tokens(query)
        query_tokens = set(original_query_tokens)
        if not query_tokens:
            return []

        scored_chunks = []
        q_lower = query.lower()
        phrase_aliases = {
            "risk profiling": {"risk", "profile", "suitability"},
            "risk tolerance": {"risk", "profile", "tolerance"},
            "advisory fee": {"fee", "client", "aua"},
            "fee cap": {"fee", "cap", "aua"},
            "insider trading": {"insider", "trade", "upsi"},
            "minimum age": {"age", "minor", "demat"},
            "investor complaint": {"investor", "complaint", "scores"},
            "smart odr": {"smart", "odr", "dispute"},
            "pump and dump": {"pump", "dump", "fraud"},
            "algorithmic trading": {"algorithm", "trade", "risk"},
        }
        for phrase, aliases in phrase_aliases.items():
            if phrase in q_lower:
                query_tokens.update(aliases)

        for doc in SEBI_REGULATORY_DOCUMENTS:
            if category and category.lower() not in {doc["category"].lower(), doc["doc_id"].lower()}:
                continue
            for sec in doc["sections"]:
                searchable = f"{doc['title']} {doc['category']} {sec['section']} {sec['summary']} {sec['text']}"
                doc_tokens = tokens(searchable)
                overlap = query_tokens & doc_tokens
                if not overlap:
                    continue
                # A single coincidental word (for example, "capital" in a
                # question about France) is not enough to claim regulatory relevance.
                original_overlap = original_query_tokens & doc_tokens
                if len(original_query_tokens) > 1 and len(original_overlap) < 2:
                    continue

                # Measure how much of the question is covered. Section/title hits
                # add weight while generic matches in long legal text add less.
                score = 0.72 * len(overlap) / len(query_tokens)
                title_section_tokens = tokens(f"{doc['title']} {sec['section']} {sec['summary']}")
                score += 0.18 * len(query_tokens & title_section_tokens) / len(query_tokens)
                scored_chunks.append({
                    "doc_id": doc["doc_id"],
                    "title": doc["title"],
                    "section": sec["section"],
                    "circular_no": doc.get("circular_no", "SEBI Statutory Gazette"),
                    "official_url": doc["official_url"],
                    "text": sec["text"],
                    "summary": sec["summary"],
                    "score": round(min(0.99, score), 2),
                })

        scored_chunks.sort(key=lambda item: item["score"], reverse=True)
        # The old 0.40 score floor made every corpus section appear relevant.
        return [item for item in scored_chunks if item["score"] >= 0.22][:top_k]

    @classmethod
    def answer_query(cls, request: SebiQueryRequest) -> SebiQueryResponse:
        """Execute RAG pipeline: Retrieve relevant SEBI chunks and synthesize grounded answer."""
        query = request.query.strip()
        session_id = request.session_id or str(uuid.uuid4())

        retrieved_chunks = cls.search_sebi_corpus(query=query, top_k=3, category=request.category)
        primary = retrieved_chunks[0] if retrieved_chunks else None
        top_chunks = ([primary] + [chunk for chunk in retrieved_chunks[1:]
                                    if chunk["doc_id"] != primary["doc_id"] and chunk["score"] >= 0.35]) if primary else []

        # Synthesize authoritative answer referencing the retrieved statutory sections
        primary_chunk = top_chunks[0] if top_chunks else None
        citations: List[SebiSourceCitation] = []

        for ch in top_chunks:
            citations.append(
                SebiSourceCitation(
                    doc_id=ch["doc_id"],
                    title=ch["title"],
                    section=ch["section"],
                    circular_no=ch["circular_no"],
                    official_url=ch["official_url"],
                    excerpt=ch["summary"],
                    relevance_score=ch["score"],
                )
            )

        if primary_chunk:
            ans_lead = (
                f"Under the **{primary_chunk['title']}** ({primary_chunk['section']}), "
                f"the relevant rule is:\n\n"
            )
            ans_body = f"{primary_chunk['text']}\n\n"

            if len(top_chunks) > 1 and top_chunks[1]["doc_id"] != primary_chunk["doc_id"] and top_chunks[1]["score"] >= 0.35:
                sec_chunk = top_chunks[1]
                ans_secondary = (
                    f"Related provision from **{sec_chunk['title']}** (*{sec_chunk['section']}*):\n"
                    f"{sec_chunk['text']}\n\n"
                )
            else:
                ans_secondary = ""

            final_answer = ans_lead + ans_body + ans_secondary.strip()
        else:
            final_answer = (
                "I couldn’t find a sufficiently relevant passage in the installed SEBI material to answer that reliably. "
                "Try asking about investment adviser risk profiling or fees, UPSI and insider trading, market manipulation, "
                "SCORES grievances, demat eligibility, or retail derivatives disclosures."
            )

        return SebiQueryResponse(
            query=query,
            answer=final_answer,
            citations=citations,
            statutory_disclaimer=(
                "Information provided by the SEBI RAG Compliance Assistant is synthesized from official SEBI gazettes, "
                "regulations, and master circulars with live NSE market connectivity. It is for informational and educational "
                "purposes and does not constitute formal legal counsel."
            ),
            session_id=session_id,
            timestamp=datetime.now(timezone.utc),
        )

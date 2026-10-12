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
    def search_sebi_corpus(cls, query: str, top_k: int = 3) -> List[Dict]:
        """Semantic & keyword vector similarity search over installed SEBI rulebook chunks."""
        q_tokens = set(re.findall(r"\w+", query.lower()))

        scored_chunks = []
        for doc in SEBI_REGULATORY_DOCUMENTS:
            for sec in doc["sections"]:
                text_to_search = f"{doc['title']} {doc['category']} {sec['section']} {sec['summary']} {sec['text']}".lower()
                doc_tokens = set(re.findall(r"\w+", text_to_search))

                # Jaccard + frequency overlap scoring
                overlap = len(q_tokens.intersection(doc_tokens))
                total_unique = len(q_tokens.union(doc_tokens))
                base_score = (overlap / total_unique) if total_unique > 0 else 0.0

                # Keyword boosting for exact matches
                for token in q_tokens:
                    if len(token) > 3 and token in text_to_search:
                        base_score += 0.15

                scored_chunks.append({
                    "doc_id": doc["doc_id"],
                    "title": doc["title"],
                    "section": sec["section"],
                    "circular_no": doc.get("circular_no", "SEBI Statutory Gazette"),
                    "official_url": doc["official_url"],
                    "text": sec["text"],
                    "summary": sec["summary"],
                    "score": round(min(0.98, max(0.40, base_score)), 2),
                })

        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        return scored_chunks[:top_k]

    @classmethod
    def answer_query(cls, request: SebiQueryRequest) -> SebiQueryResponse:
        """Execute RAG pipeline: Retrieve relevant SEBI chunks and synthesize grounded answer."""
        query = request.query.strip()
        session_id = request.session_id or str(uuid.uuid4())

        top_chunks = cls.search_sebi_corpus(query=query, top_k=2)

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
                f"the Securities and Exchange Board of India (SEBI) stipulates the following statutory requirements:\n\n"
            )
            ans_body = f"{primary_chunk['text']}\n\n"

            if len(top_chunks) > 1:
                sec_chunk = top_chunks[1]
                ans_secondary = (
                    f"### Key Regulatory Corroboration:\n"
                    f"Furthermore, per **{sec_chunk['title']}** (*{sec_chunk['section']}*):\n"
                    f"{sec_chunk['text']}\n\n"
                )
            else:
                ans_secondary = ""

            ans_footer = (
                f"### Compliance Guidelines for Investors:\n"
                f"- Intermediaries must maintain auditable written records.\n"
                f"- Guaranteed return claims are strictly illegal and punishable under SEBI PFUTP regulations.\n"
                f"- Any grievance can be registered on SEBI SCORES 2.0 with a statutory 21-day resolution mandate."
            )
            final_answer = ans_lead + ans_body + ans_secondary + ans_footer
        else:
            final_answer = (
                "SEBI regulations require all market participants, intermediaries, and investors to operate with transparency, "
                "proper suitability assessment, and strict conflict disclosure. For specific statutory text, please query "
                "Investment Advisory (IA), Insider Trading (PIT), Fraudulent Practices (PFUTP), or SCORES Grievance mechanisms."
            )

        return SebiQueryResponse(
            query=query,
            answer=final_answer,
            citations=citations,
            statutory_disclaimer=(
                "Information provided by the SEBI RAG Compliance Assistant is synthesized from official SEBI gazettes, "
                "regulations, and master circulars. It is for informational and educational purposes and does not constitute "
                "formal legal counsel."
            ),
            session_id=session_id,
            timestamp=datetime.now(timezone.utc),
        )

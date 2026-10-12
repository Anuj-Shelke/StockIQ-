"""Retrieval-Augmented Generation (RAG) Service for Financial Education."""

from datetime import datetime, timezone
import uuid
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from app.integrations.llm.gemini_client import GeminiClient
from app.integrations.vector_store.pgvector_store import PGVectorStore
from app.models.chat import ChatMessage as ChatMessageModel, ChatSession
from app.schemas.chatbot import ChatQueryResponse, ChatSourceItem
from app.schemas.education import ChatMessage, SourceCitation


# Singleton vector store instance
_vector_store = PGVectorStore()
# In-memory session store fallback
_in_memory_chat_history: Dict[str, List[Dict]] = {}


class RAGService:
    """Orchestrates document vector retrieval, prompt grounding, and citation generation."""

    @classmethod
    def search_knowledge_base(cls, query: str, top_k: int = 3, db: Optional[Session] = None) -> List[Dict]:
        """Perform semantic search against vector database."""
        return _vector_store.search(query=query, top_k=top_k, db=db)

    @classmethod
    def generate_grounded_answer(
        cls,
        query: str,
        session_id: Optional[str] = None,
        user_id: Optional[str] = None,
        db: Optional[Session] = None,
    ) -> ChatQueryResponse:
        """Retrieve relevant regulatory chunks and synthesize grounded answer with citations."""
        clean_sid = session_id or str(uuid.uuid4())

        # 1. Retrieve knowledge chunks via vector store
        contexts = cls.search_knowledge_base(query=query, top_k=2, db=db)

        # 2. Synthesize grounded answer
        answer = GeminiClient.synthesize_answer(query=query, retrieved_contexts=contexts)

        # 3. Format citations
        sources: List[ChatSourceItem] = []
        for ctx in contexts:
            sources.append(
                ChatSourceItem(
                    title=ctx["title"],
                    source_url=ctx.get("url"),
                    reference=ctx["publisher"],
                )
            )

        now = datetime.now(timezone.utc)

        # 4. Record to database if available
        if db and user_id:
            try:
                # Check or create session
                sess = db.query(ChatSession).filter(ChatSession.id == clean_sid).first()
                if not sess:
                    sess = ChatSession(
                        id=clean_sid,
                        user_id=user_id,
                        title=query[:40],
                    )
                    db.add(sess)
                    db.commit()

                # Add user message
                user_msg = ChatMessageModel(
                    id=str(uuid.uuid4()),
                    session_id=clean_sid,
                    sender="user",
                    message=query,
                )
                db.add(user_msg)

                # Add assistant message
                bot_msg = ChatMessageModel(
                    id=str(uuid.uuid4()),
                    session_id=clean_sid,
                    sender="assistant",
                    message=answer,
                    sources=[s.model_dump() for s in sources],
                )
                db.add(bot_msg)
                db.commit()
            except Exception:
                db.rollback()

        # Update in-memory history fallback
        if clean_sid not in _in_memory_chat_history:
            _in_memory_chat_history[clean_sid] = []
        _in_memory_chat_history[clean_sid].append({"sender": "user", "message": query, "time": now.isoformat()})
        _in_memory_chat_history[clean_sid].append({"sender": "assistant", "message": answer, "time": now.isoformat(), "sources": sources})

        return ChatQueryResponse(
            session_id=clean_sid,
            query=query,
            answer=answer,
            sources=sources,
            created_at=now,
        )

    @classmethod
    def get_education_chat_message(
        cls,
        query: str,
        session_id: Optional[str] = None,
        user_id: Optional[str] = None,
        db: Optional[Session] = None,
    ) -> ChatMessage:
        """Generate response formatted for the EducationHub ChatAssistant component."""
        res = cls.generate_grounded_answer(query=query, session_id=session_id, user_id=user_id, db=db)
        citations: List[SourceCitation] = [
            SourceCitation(
                id=str(uuid.uuid4())[:8],
                title=s.title,
                publisher=s.reference,
                url=s.source_url,
                confidence_score=0.92,
            )
            for s in res.sources
        ]
        return ChatMessage(
            id=str(uuid.uuid4()),
            sender="assistant",
            content=res.answer,
            timestamp=res.created_at.strftime("%I:%M %p"),
            sources=citations,
        )

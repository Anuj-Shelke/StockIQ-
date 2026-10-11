"""Chat session and message models for SEBI RAG Chatbot."""

import uuid
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship, synonym
from sqlalchemy.types import JSON

from app.db.base import Base, GUID


class ChatSession(Base):
    """User conversation session."""
    __tablename__ = "chat_sessions"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), default="New Conversation", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship(
        "ChatMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at",
    )


class ChatMessage(Base):
    """Individual message in a chat session with citations and telemetry."""
    __tablename__ = "chat_messages"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    session_id = Column(GUID(), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False, default="user")  # 'user', 'assistant', 'system'
    sender = synonym("role")

    content = Column(Text, nullable=False)
    message = synonym("content")

    sources_json = Column(JSON().with_variant(JSONB, "postgresql"), nullable=True)  # Citations list
    feedback = Column(SmallInteger, nullable=True)  # +1 (thumbs up), -1 (thumbs down)
    latency_ms = Column(Integer, nullable=True)
    prompt_version = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    __table_args__ = (
        Index("idx_chat_messages_session_created", "session_id", "created_at"),
    )

    # Relationships
    session = relationship("ChatSession", back_populates="messages")

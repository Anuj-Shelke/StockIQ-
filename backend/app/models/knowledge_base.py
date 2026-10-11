"""Knowledge Base Document and Chunk models with pgvector support."""

import uuid
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import TSVECTOR, UUID
from sqlalchemy.orm import relationship

from app.db.session import Base

try:
    from pgvector.sqlalchemy import Vector
except ImportError:
    from sqlalchemy.types import UserDefinedType

    class Vector(UserDefinedType):  # type: ignore
        def __init__(self, dim: int = 384):
            self.dim = dim

        def get_col_spec(self, **kw) -> str:
            return f"vector({self.dim})"


class KBDocument(Base):
    """SEBI regulatory or educational document entity."""
    __tablename__ = "kb_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    source_url = Column(Text, nullable=True)
    version = Column(String(50), default="1.0")
    status = Column(String(50), default="active")  # 'active', 'superseded', 'draft'
    checksum = Column(String(64), unique=True, nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    chunks = relationship("KBChunk", back_populates="document", cascade="all, delete-orphan")


class KBChunk(Base):
    """Text chunks with vector embeddings and full-text search vector."""
    __tablename__ = "kb_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("kb_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_text = Column(Text, nullable=False)
    embedding = Column(Vector(384), nullable=True)  # bge-small-en-v1.5 dimension
    page_no = Column(Integer, nullable=True)
    tsv = Column(TSVECTOR, nullable=True)  # Full-text search tsvector

    __table_args__ = (
        Index("idx_kb_chunks_tsv", "tsv", postgresql_using="gin"),
        Index(
            "idx_kb_chunks_embedding",
            "embedding",
            postgresql_using="hnsw",
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )

    # Relationships
    document = relationship("KBDocument", back_populates="chunks")

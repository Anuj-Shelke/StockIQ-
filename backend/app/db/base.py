"""Base declarative class and metadata registry for Alembic and SQLAlchemy 2."""

from datetime import datetime, timezone
import uuid
from sqlalchemy import CHAR, DateTime, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.types import TypeDecorator


class GUID(TypeDecorator):
    """Platform-independent GUID/UUID type.
    Uses PostgreSQL's native UUID type, otherwise uses CHAR(36),
    storing as stringified hex values with hyphens.
    Supports both str and uuid.UUID objects transparently.
    """

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            if isinstance(value, uuid.UUID):
                return value
            return uuid.UUID(str(value))
        else:
            if isinstance(value, uuid.UUID):
                return str(value)
            try:
                return str(uuid.UUID(str(value)))
            except Exception:
                return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            if isinstance(value, uuid.UUID):
                return value
            try:
                return uuid.UUID(str(value))
            except Exception:
                return str(value)
        else:
            return str(value)


class Base(DeclarativeBase):
    """Base declarative class for all SQLAlchemy 2 ORM models."""
    pass


class TimestampMixin:
    """Reusable mixin for created_at and updated_at timestamps."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class UUIDMixin:
    """Reusable mixin for UUID string primary keys."""

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        nullable=False,
    )


# Import all models to ensure Base.metadata is fully populated for Alembic
from app.models import (  # noqa: E402, F401
    User,
    InvestorProfile,
    Stock,
    PriceHistory,
    Portfolio,
    Holding,
    Simulation,
    Prediction,
    ShapExplanation,
    Recommendation,
    ChatSession,
    ChatMessage,
    KBDocument,
    KBChunk,
    AuditLog,
    LLMUsage,
    AssetRate,
    FeatureFlag,
    TaxTransaction,
    TaxCalculationRecord,
    PlannerProfile,
    InvestmentPlanRecord,
)

__all__ = ["Base", "GUID", "TimestampMixin", "UUIDMixin"]

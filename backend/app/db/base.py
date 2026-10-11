"""Base declarative class and metadata registry for Alembic."""

from app.db.session import Base
from app.models import (
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
)

__all__ = ["Base"]

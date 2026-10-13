"""System supporting models (audit logs, telemetry, asset rates, flags)."""

import uuid
from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


class AuditLog(Base):
    """User and system activity audit trail."""
    __tablename__ = "audit_logs"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    ip_address = Column(String(45), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)


class LLMUsage(Base):
    """LLM cost and token usage tracking."""
    __tablename__ = "llm_usage"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    model = Column(String(100), nullable=False)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    estimated_cost_usd = Column(Numeric(10, 6), default=0.0)
    latency_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)


class AssetRate(Base):
    """Benchmark rates for Stock vs Gold vs FD comparisons."""
    __tablename__ = "asset_rates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    asset_type = Column(String(50), nullable=False)  # 'GOLD', 'FD', 'INFLATION'
    rate_date = Column(Date, nullable=False, index=True)
    annual_rate_pct = Column(Numeric(6, 4), nullable=False)  # e.g., 6.8500 for 6.85%

    __table_args__ = (
        UniqueConstraint("asset_type", "rate_date", name="uq_asset_rate_date"),
    )


class FeatureFlag(Base):
    """Runtime toggles for system features."""
    __tablename__ = "feature_flags"

    key = Column(String(100), primary_key=True)
    is_enabled = Column(Boolean, default=False, nullable=False)
    description = Column(String(255), nullable=True)

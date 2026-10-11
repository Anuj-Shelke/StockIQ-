"""Portfolio, Holding, and What-if Simulation models."""

import uuid
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship, synonym
from sqlalchemy.types import JSON

from app.db.base import Base, GUID


class Portfolio(Base):
    """User investment portfolio container."""
    __tablename__ = "portfolios"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), default="Primary Portfolio", nullable=False)
    description = Column(Text, nullable=True)
    total_value = Column(Numeric(15, 2), default=0.0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    # Relationships
    user = relationship("User", back_populates="portfolios")
    holdings = relationship("Holding", back_populates="portfolio", cascade="all, delete-orphan")
    simulations = relationship("Simulation", back_populates="portfolio", cascade="all, delete-orphan")


class Holding(Base):
    """Specific stock or asset holding inside a portfolio."""
    __tablename__ = "holdings"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    portfolio_id = Column(GUID(), ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol = Column(String(20), ForeignKey("stocks.symbol", ondelete="CASCADE"), nullable=False)
    asset_type = Column(String(50), default="stock", nullable=False)
    quantity = Column(Numeric(12, 4), nullable=False)
    avg_buy_price = Column(Numeric(12, 4), default=0.0, nullable=False)
    buy_price = synonym("avg_buy_price")
    current_price = Column(Numeric(12, 4), default=0.0, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    __table_args__ = (
        UniqueConstraint("portfolio_id", "symbol", name="uq_portfolio_symbol"),
    )

    # Relationships
    portfolio = relationship("Portfolio", back_populates="holdings")
    stock = relationship("Stock", back_populates="holdings")


class Simulation(Base):
    """What-if portfolio scenario simulation history."""
    __tablename__ = "simulations"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    portfolio_id = Column(GUID(), ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False, index=True)
    change_json = Column(JSON().with_variant(JSONB, "postgresql"), nullable=False)
    exposure_before = Column(JSON().with_variant(JSONB, "postgresql"), nullable=True)
    exposure_after = Column(JSON().with_variant(JSONB, "postgresql"), nullable=True)
    risk_before = Column(Integer, nullable=True)
    risk_after = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    portfolio = relationship("Portfolio", back_populates="simulations")

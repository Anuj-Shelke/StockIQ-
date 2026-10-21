"""SQLAlchemy models for Tax Transactions and Calculation Audit History."""

import uuid
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON

from app.db.base import Base, GUID


class TaxTransaction(Base):
    """Realized or planned transaction records for tax tracking."""
    __tablename__ = "tax_transactions"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    portfolio_id = Column(GUID(), ForeignKey("portfolios.id", ondelete="SET NULL"), nullable=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    asset_category = Column(String(50), default="LISTED_EQUITY", nullable=False)
    exchange = Column(String(20), default="NSE", nullable=False)
    purchase_date = Column(Date, nullable=True)
    purchase_price = Column(Numeric(12, 4), nullable=False)
    quantity = Column(Numeric(12, 4), nullable=False)
    sale_date = Column(Date, nullable=True)
    sale_price = Column(Numeric(12, 4), nullable=True)
    eligible_expenses = Column(Numeric(12, 4), default=0.0, nullable=False)
    ineligible_expenses = Column(Numeric(12, 4), default=0.0, nullable=False)
    financial_year = Column(String(20), nullable=False, index=True)
    is_realized = Column(Boolean, default=True, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    # Relationships
    user = relationship("User", back_populates="tax_transactions")


class TaxCalculationRecord(Base):
    """Audit trail and historical snapshots of capital gains tax calculations."""
    __tablename__ = "tax_calculation_records"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    financial_year = Column(String(20), nullable=False, index=True)
    asset_symbol = Column(String(20), nullable=False, index=True)
    transaction_details = Column(JSON().with_variant(JSONB, "postgresql"), nullable=False)
    calculation_inputs = Column(JSON().with_variant(JSONB, "postgresql"), nullable=False)
    calculated_gains = Column(JSON().with_variant(JSONB, "postgresql"), nullable=False)
    tax_category = Column(String(50), nullable=False)
    tax_rule_version = Column(String(50), nullable=False)
    estimated_tax = Column(Numeric(15, 2), default=0.0, nullable=False)
    estimated_after_tax_profit = Column(Numeric(15, 2), default=0.0, nullable=False)
    relevant_assumptions = Column(JSON().with_variant(JSONB, "postgresql"), nullable=True)
    missing_information_warnings = Column(JSON().with_variant(JSONB, "postgresql"), nullable=True)
    explanation_snapshot = Column(JSON().with_variant(JSONB, "postgresql"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="tax_calculations")

"""User and Investor Profile SQLAlchemy models."""

import uuid
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class User(Base):
    """User account entity."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="investor", nullable=False)  # 'investor', 'admin'
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    profile = relationship("InvestorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    portfolios = relationship("Portfolio", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")


class InvestorProfile(Base):
    """Investor financial profile and risk preferences."""
    __tablename__ = "investor_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    age = Column(Integer, nullable=True)
    occupation = Column(String(100), nullable=True)
    annual_income = Column(Numeric(15, 2), nullable=True)
    risk_tolerance = Column(String(50), default="moderate")  # 'low', 'moderate', 'high'
    horizon_years = Column(Integer, default=5)
    goal = Column(String(255), nullable=True)
    invest_amount = Column(Numeric(15, 2), nullable=True)
    risk_score_computed = Column(Integer, nullable=True)  # 0 to 100

    __table_args__ = (
        CheckConstraint("age >= 18 AND age <= 100", name="check_valid_age"),
    )

    # Relationships
    user = relationship("User", back_populates="profile")

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
from sqlalchemy.orm import relationship, synonym

from app.db.base import Base, GUID


class User(Base):
    """User account entity."""
    __tablename__ = "users"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    hashed_password = synonym("password_hash")

    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="investor", nullable=False)  # 'investor', 'admin'
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    # Relationships
    profile = relationship("InvestorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    portfolios = relationship("Portfolio", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    tax_transactions = relationship("TaxTransaction", back_populates="user", cascade="all, delete-orphan")
    tax_calculations = relationship("TaxCalculationRecord", back_populates="user", cascade="all, delete-orphan")
    planner_profiles = relationship("PlannerProfile", back_populates="user", cascade="all, delete-orphan")
    investment_plans = relationship("InvestmentPlanRecord", back_populates="user", cascade="all, delete-orphan")


class InvestorProfile(Base):
    """Investor financial profile and risk preferences."""
    __tablename__ = "investor_profiles"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    age = Column(Integer, nullable=True)
    occupation = Column(String(100), nullable=True)
    annual_income = Column(Numeric(15, 2), nullable=True)
    risk_tolerance = Column(String(50), default="moderate")  # 'low', 'moderate', 'high'
    horizon_years = Column(Integer, default=5)
    investment_horizon_years = synonym("horizon_years")

    goal = Column(String(255), nullable=True)
    goals = synonym("goal")

    invest_amount = Column(Numeric(15, 2), nullable=True)
    monthly_investment = synonym("invest_amount")

    risk_score_computed = Column(Integer, nullable=True)  # 0 to 100

    __table_args__ = (
        CheckConstraint("age >= 18 AND age <= 100", name="check_valid_age"),
    )

    # Relationships
    user = relationship("User", back_populates="profile")

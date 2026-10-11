"""Prediction, SHAP Explanation, and Recommendation SQLAlchemy models."""

import uuid
from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship, synonym

from app.db.base import Base, GUID


class Prediction(Base):
    """Daily ML signal prediction per stock."""
    __tablename__ = "predictions"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    symbol = Column(String(20), ForeignKey("stocks.symbol", ondelete="CASCADE"), nullable=False, index=True)
    stock_symbol = synonym("symbol")

    pred_date = Column(Date, nullable=False, index=True, default=func.current_date())
    model_version = Column(String(50), nullable=False, default="ensemble_v1")
    model_name = synonym("model_version")

    signal = Column(String(20), nullable=False, default="HOLD")  # 'BUY', 'HOLD', 'SELL'
    confidence = Column(Numeric(5, 4), nullable=False, default=0.0)  # Calibrated probability (0.0000 - 1.0000)
    confidence_score = synonym("confidence")

    target_horizon = Column(String(50), default="30d", nullable=True)
    predicted_price = Column(Numeric(12, 4), nullable=True)
    summary = Column(Text, nullable=True)

    p_up = Column(Numeric(5, 4), nullable=True)  # P(next close > today close)
    p_gap_up = Column(Numeric(5, 4), nullable=True)  # P(open > today close)

    # Quantile regression ranges (P10, P50, P90)
    open_p10 = Column(Numeric(12, 4), nullable=True)
    open_p50 = Column(Numeric(12, 4), nullable=True)
    open_p90 = Column(Numeric(12, 4), nullable=True)
    close_p10 = Column(Numeric(12, 4), nullable=True)
    close_p50 = Column(Numeric(12, 4), nullable=True)
    close_p90 = Column(Numeric(12, 4), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    __table_args__ = (
        UniqueConstraint("symbol", "pred_date", "model_version", name="uq_stock_pred_version"),
    )

    # Relationships
    stock = relationship("Stock", back_populates="predictions")
    explanations = relationship("ShapExplanation", back_populates="prediction", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="prediction", cascade="all, delete-orphan")


class ShapExplanation(Base):
    """SHAP feature-level contributions for explainability."""
    __tablename__ = "shap_explanations"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    prediction_id = Column(GUID(), ForeignKey("predictions.id", ondelete="CASCADE"), nullable=False, index=True)
    feature = Column(String(100), nullable=False)
    feature_name = synonym("feature")

    shap_value = Column(Numeric(10, 6), nullable=False, default=0.0)
    importance_score = synonym("shap_value")

    direction = Column(String(20), default="positive", nullable=True)  # 'positive', 'negative'
    rank = Column(Integer, nullable=False, default=1)
    plain_text = Column(Text, nullable=True)

    # Relationships
    prediction = relationship("Prediction", back_populates="explanations")


class Recommendation(Base):
    """Personalized suitability result linking user profile and stock signal."""
    __tablename__ = "recommendations"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    prediction_id = Column(GUID(), ForeignKey("predictions.id", ondelete="CASCADE"), nullable=False, index=True)
    suitability = Column(String(50), nullable=False)  # 'SUITABLE', 'MODERATE', 'LOW'
    reason_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_recommendations_user_created", "user_id", "created_at"),
    )

    # Relationships
    user = relationship("User", back_populates="recommendations")
    prediction = relationship("Prediction", back_populates="recommendations")

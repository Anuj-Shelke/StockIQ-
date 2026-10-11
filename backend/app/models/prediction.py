from typing import List, Optional
from sqlalchemy import Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class Prediction(Base, UUIDMixin, TimestampMixin):
    """Machine learning prediction snapshot."""

    __tablename__ = "predictions"

    stock_symbol: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    model_name: Mapped[str] = mapped_column(String(100), default="ensemble_v1", nullable=False)
    target_horizon: Mapped[str] = mapped_column(String(50), default="30d", nullable=False)
    predicted_price: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    explanations: Mapped[List["ShapExplanation"]] = relationship(
        "ShapExplanation",
        back_populates="prediction",
        cascade="all, delete-orphan",
    )


class ShapExplanation(Base, UUIDMixin, TimestampMixin):
    """Feature importance factor explaining a prediction."""

    __tablename__ = "shap_explanations"

    prediction_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("predictions.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    feature_name: Mapped[str] = mapped_column(String(100), nullable=False)
    importance_score: Mapped[float] = mapped_column(Float, nullable=False)
    direction: Mapped[str] = mapped_column(String(20), default="positive", nullable=False)  # positive, negative

    # Relationships
    prediction: Mapped["Prediction"] = relationship("Prediction", back_populates="explanations")

from typing import Optional
from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class InvestorProfile(Base, UUIDMixin, TimestampMixin):
    """Investor risk and preferences profile."""

    __tablename__ = "investor_profiles"

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    risk_tolerance: Mapped[str] = mapped_column(String(50), default="moderate", nullable=False)
    investment_horizon_years: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    monthly_investment: Mapped[float] = mapped_column(Float, default=10000.0, nullable=False)
    goals: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="profile")

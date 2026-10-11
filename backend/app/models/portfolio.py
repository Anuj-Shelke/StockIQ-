from typing import List, Optional
from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class Portfolio(Base, UUIDMixin, TimestampMixin):
    """User investment portfolio entity."""

    __tablename__ = "portfolios"

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    total_value: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="portfolios")
    holdings: Mapped[List["Holding"]] = relationship(
        "Holding",
        back_populates="portfolio",
        cascade="all, delete-orphan",
    )


class Holding(Base, UUIDMixin, TimestampMixin):
    """Individual holding item within a portfolio."""

    __tablename__ = "holdings"

    portfolio_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("portfolios.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    symbol: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    asset_type: Mapped[str] = mapped_column(String(50), default="stock", nullable=False)  # stock, gold, fd
    quantity: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    buy_price: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    current_price: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Relationships
    portfolio: Mapped["Portfolio"] = relationship("Portfolio", back_populates="holdings")

from datetime import date
from typing import List, Optional
from sqlalchemy import Boolean, Date, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class Stock(Base, UUIDMixin, TimestampMixin):
    """Stock instrument metadata entity."""

    __tablename__ = "stocks"

    symbol: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    exchange: Mapped[str] = mapped_column(String(20), default="NSE", nullable=False)
    sector: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    current_price: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    price_history: Mapped[List["PriceHistory"]] = relationship(
        "PriceHistory",
        back_populates="stock",
        cascade="all, delete-orphan",
    )


class PriceHistory(Base, UUIDMixin, TimestampMixin):
    """Historical daily price record."""

    __tablename__ = "price_history"

    stock_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("stocks.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    open_price: Mapped[float] = mapped_column(Float, nullable=False)
    high_price: Mapped[float] = mapped_column(Float, nullable=False)
    low_price: Mapped[float] = mapped_column(Float, nullable=False)
    close_price: Mapped[float] = mapped_column(Float, nullable=False)
    volume: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    stock: Mapped["Stock"] = relationship("Stock", back_populates="price_history")

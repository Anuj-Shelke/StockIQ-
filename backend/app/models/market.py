"""Stock and Price History SQLAlchemy models."""

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    Date,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship, synonym

from app.db.base import Base


class Stock(Base):
    """Stock security entity."""
    __tablename__ = "stocks"

    symbol = Column(String(20), primary_key=True)  # e.g., 'TCS.NS', 'RELIANCE.NS'
    id = synonym("symbol")

    name = Column(String(255), nullable=False)
    sector = Column(String(100), nullable=True, index=True)
    exchange = Column(String(20), default="NSE", nullable=False)
    beta = Column(Numeric(6, 4), nullable=True)
    current_price = Column(Numeric(12, 4), default=0.0, nullable=True)
    currency = Column(String(10), default="INR", nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    price_history = relationship("PriceHistory", back_populates="stock", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="stock", cascade="all, delete-orphan")
    holdings = relationship("Holding", back_populates="stock")


class PriceHistory(Base):
    """Daily OHLCV price history."""
    __tablename__ = "price_history"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    symbol = Column(String(20), ForeignKey("stocks.symbol", ondelete="CASCADE"), nullable=False, index=True)
    stock_id = synonym("symbol")

    trade_date = Column(Date, nullable=False, index=True)
    date = synonym("trade_date")

    open = Column(Numeric(12, 4), nullable=False)
    open_price = synonym("open")

    high = Column(Numeric(12, 4), nullable=False)
    high_price = synonym("high")

    low = Column(Numeric(12, 4), nullable=False)
    low_price = synonym("low")

    close = Column(Numeric(12, 4), nullable=False)
    close_price = synonym("close")

    volume = Column(BigInteger, nullable=False)

    __table_args__ = (
        UniqueConstraint("symbol", "trade_date", name="uq_stock_trade_date"),
    )

    # Relationships
    stock = relationship("Stock", back_populates="price_history")

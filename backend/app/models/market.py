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
from sqlalchemy.orm import relationship

from app.db.session import Base


class Stock(Base):
    """Stock security entity."""
    __tablename__ = "stocks"

    symbol = Column(String(20), primary_key=True)  # e.g., 'TCS.NS', 'RELIANCE.NS'
    name = Column(String(255), nullable=False)
    sector = Column(String(100), nullable=True, index=True)
    exchange = Column(String(20), default="NSE", nullable=False)
    beta = Column(Numeric(6, 4), nullable=True)
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
    trade_date = Column(Date, nullable=False, index=True)
    open = Column(Numeric(12, 4), nullable=False)
    high = Column(Numeric(12, 4), nullable=False)
    low = Column(Numeric(12, 4), nullable=False)
    close = Column(Numeric(12, 4), nullable=False)
    volume = Column(BigInteger, nullable=False)

    __table_args__ = (
        UniqueConstraint("symbol", "trade_date", name="uq_stock_trade_date"),
    )

    # Relationships
    stock = relationship("Stock", back_populates="price_history")

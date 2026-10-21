"""Database session and connection management with automatic PostgreSQL / SQLite fallback."""

import socket
from typing import AsyncGenerator, Generator
from urllib.parse import urlparse
from sqlalchemy import create_engine, text
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import Session, sessionmaker
from pgvector.sqlalchemy import Vector

from app.core.config import settings
from app.core.logging import logger
from app.db.base import Base

# Register SQLite compilers for PostgreSQL-specific types when running in SQLite fallback
@compiles(TSVECTOR, "sqlite")
def compile_tsvector(element, compiler, **kw):
    return "TEXT"


@compiles(Vector, "sqlite")
def compile_vector(element, compiler, **kw):
    return "TEXT"


def is_postgres_available() -> bool:
    """Fast socket probe against the host in the configured database URL."""
    parsed = urlparse(settings.DATABASE_URL or "")
    host = parsed.hostname or settings.POSTGRES_HOST
    port = parsed.port or settings.POSTGRES_PORT
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.5)
    try:
        s.connect((host, port))
        return True
    except Exception:
        return False
    finally:
        s.close()


# Configure database engine. SQLite fallback is an explicit local-development choice.
configured_url = settings.DATABASE_URL or ""
explicit_sqlite = configured_url.startswith("sqlite")
postgres_available = is_postgres_available() if not explicit_sqlite else False
use_sqlite = explicit_sqlite or (not postgres_available and settings.ALLOW_SQLITE_FALLBACK)

if use_sqlite:
    sqlite_url = configured_url if explicit_sqlite else "sqlite:///./stockiq.db"
    engine = create_engine(
        sqlite_url,
        echo=False,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(
        configured_url,
        echo=False,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 3},
    )


def _masked_db_host() -> str:
    host = engine.url.host
    if not host:
        return "local"
    if host in {"localhost", "127.0.0.1", "::1"}:
        return "localhost"
    parts = host.split(".")
    return "[redacted]." + ".".join(parts[-2:]) if len(parts) > 2 else "[redacted]"


logger.info("Database configured: dialect=%s host=%s", engine.dialect.name, _masked_db_host())

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# Async engine setup (optional)
try:
    if not use_sqlite and settings.ASYNC_DATABASE_URL:
        async_engine = create_async_engine(
            settings.ASYNC_DATABASE_URL,
            pool_pre_ping=True,
        )
        AsyncSessionLocal = async_sessionmaker(
            bind=async_engine,
            autocommit=False,
            autoflush=False,
            expire_on_commit=False,
        )
    else:
        async_engine = None
        AsyncSessionLocal = None
except Exception:
    async_engine = None
    AsyncSessionLocal = None


def seed_default_data(db: Session) -> None:
    """Seed initial stocks and demo user if database is currently empty."""
    try:
        from app.models.stock import Stock
        from app.models.user import User, InvestorProfile
        from app.models.portfolio import Portfolio, Holding
        from app.models.tax import TaxTransaction, TaxCalculationRecord
        from app.core.security import get_password_hash

        # Seed stocks
        if db.query(Stock).count() == 0:
            default_stocks = [
                Stock(symbol="RELIANCE.NS", name="Reliance Industries Ltd.", exchange="NSE", sector="Energy & Conglomerate", current_price=2980.50, is_active=True),
                Stock(symbol="TCS.NS", name="Tata Consultancy Services Ltd.", exchange="NSE", sector="Information Technology", current_price=4120.25, is_active=True),
                Stock(symbol="INFY.NS", name="Infosys Ltd.", exchange="NSE", sector="Information Technology", current_price=1890.10, is_active=True),
                Stock(symbol="HDFCBANK.NS", name="HDFC Bank Ltd.", exchange="NSE", sector="Banking & Financial Services", current_price=1650.80, is_active=True),
                Stock(symbol="ICICIBANK.NS", name="ICICI Bank Ltd.", exchange="NSE", sector="Banking & Financial Services", current_price=1210.45, is_active=True),
                Stock(symbol="TATAMOTORS.NS", name="Tata Motors Ltd.", exchange="NSE", sector="Automotive", current_price=975.30, is_active=True),
                Stock(symbol="GOLD", name="Gold ETF / Commodity", exchange="MCX", sector="Commodities", current_price=7540.0, is_active=True),
            ]
            db.add_all(default_stocks)
            db.commit()

        # Seed demo user
        demo_email = "demo@stockiq.ai"
        existing_demo = db.query(User).filter(User.email == demo_email).first()
        if not existing_demo:
            import uuid
            demo_user = User(
                id=uuid.uuid4(),
                email=demo_email,
                password_hash=get_password_hash("Demo@123456"),
                full_name="Demo Investor",
                role="investor",
                is_active=True,
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)

            profile = InvestorProfile(
                user_id=demo_user.id,
                age=28,
                occupation="Software Engineer",
                annual_income=1800000.0,
                risk_tolerance="moderate",
                horizon_years=5,
                goal="Wealth Growth",
                invest_amount=250000.0,
                risk_score_computed=65,
            )
            db.add(profile)

            portfolio = Portfolio(
                user_id=demo_user.id,
                name="Primary Equity Growth",
                description="Long term bluechip growth portfolio",
                total_value=245000.0,
            )
            db.add(portfolio)
            db.commit()
            db.refresh(portfolio)

            holdings = [
                Holding(portfolio_id=portfolio.id, symbol="RELIANCE.NS", quantity=40, buy_price=2750.0),
                Holding(portfolio_id=portfolio.id, symbol="TCS.NS", quantity=20, buy_price=3900.0),
                Holding(portfolio_id=portfolio.id, symbol="INFY.NS", quantity=30, buy_price=1750.0),
            ]
            db.add_all(holdings)
            db.commit()
            logger.info("Successfully seeded demo user and portfolio.")
    except Exception as exc:
        logger.warning("Could not auto-seed default data: %s", str(exc))
        db.rollback()


# Demo data seeding is opt-in and disabled by default.
if settings.SEED_DEFAULT_DATA:
    with SessionLocal() as init_db:
        seed_default_data(init_db)


def get_db() -> Generator[Session, None, None]:
    """Dependency injection yield for SQLAlchemy session."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for asynchronous database sessions."""
    if AsyncSessionLocal is None:
        raise RuntimeError("Async database engine is not configured.")
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def check_db_connection() -> dict:
    """Test the database connection for readiness probes."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {
            "status": "connected",
            "dialect": engine.url.drivername,
            "host": _masked_db_host(),
        }
    except Exception:
        logger.warning("Database connection check failed (dialect=%s host=%s)", engine.dialect.name, _masked_db_host())
        return {
            "status": "disconnected",
            "dialect": engine.dialect.name,
            "host": _masked_db_host(),
        }

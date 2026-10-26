from pathlib import Path
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

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_SQLITE_PATH = (BACKEND_DIR / "stockiq.db").resolve()

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
    sqlite_url = configured_url if explicit_sqlite else f"sqlite:///{DEFAULT_SQLITE_PATH.as_posix()}"
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
        from app.models.investment_planner import PlannerProfile, InvestmentPlanRecord
        from app.core.security import get_password_hash

        # Seed stocks
        from app.db.stock_universe_data import COMPREHENSIVE_STOCK_UNIVERSE
        existing_symbols = {s[0] for s in db.query(Stock.symbol).all()}
        stocks_to_add = []
        for stock_def in COMPREHENSIVE_STOCK_UNIVERSE:
            if stock_def["symbol"] not in existing_symbols:
                stocks_to_add.append(
                    Stock(
                        symbol=stock_def["symbol"],
                        name=stock_def["name"],
                        exchange=stock_def.get("exchange", "NSE"),
                        sector=stock_def.get("sector"),
                        beta=stock_def.get("beta"),
                        current_price=stock_def.get("current_price", 0.0),
                        is_active=stock_def.get("is_active", True),
                    )
                )
        if stocks_to_add:
            db.add_all(stocks_to_add)
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

        # Seed configured administrator user
        admin_emails = list(dict.fromkeys([
            (settings.ADMIN_EMAIL or "anujshelke12121@gmail.com").strip().lower(),
            "anujshelke12121@gmail.com",
            "admin@stockiq.ai",
        ]))
        admin_password = settings.ADMIN_PASSWORD or "admin@1234"
        admin_name = settings.ADMIN_NAME or "Anuj Shelke"

        import uuid
        for email_addr in admin_emails:
            existing_adm = db.query(User).filter(func.lower(User.email) == email_addr).first()
            if not existing_adm:
                adm_user = User(
                    id=uuid.uuid5(uuid.NAMESPACE_URL, "stockiq-admin:" + email_addr),
                    email=email_addr,
                    password_hash=get_password_hash(admin_password if email_addr == admin_emails[0] or email_addr == "anujshelke12121@gmail.com" else "adminpassword123"),
                    full_name=admin_name if email_addr == "anujshelke12121@gmail.com" else "StockIQ Administrator",
                    role="admin",
                    is_active=True,
                    is_superuser=True,
                )
                db.add(adm_user)
                db.commit()
                logger.info("Successfully seeded administrator user (%s).", email_addr)
            else:
                existing_adm.role = "admin"
                existing_adm.is_active = True
                existing_adm.is_superuser = True
                if email_addr == (settings.ADMIN_EMAIL or "anujshelke12121@gmail.com").strip().lower():
                    existing_adm.password_hash = get_password_hash(admin_password)
                db.commit()
    except Exception as exc:
        logger.warning("Could not auto-seed default data: %s", str(exc))
        db.rollback()


# Demo data seeding is opt-in and disabled by default.
def maybe_seed_default_data() -> None:
    """Seed initial stocks and demo user if database is currently empty and enabled in settings."""
    if settings.SEED_DEFAULT_DATA:
        try:
            with SessionLocal() as init_db:
                seed_default_data(init_db)
        except Exception as exc:
            logger.warning("Could not auto-seed default data: %s", str(exc))


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

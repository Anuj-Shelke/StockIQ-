"""Database session and connection management for PostgreSQL."""

from typing import AsyncGenerator, Generator
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.core.logging import logger
from app.db.base import Base

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
elif "psycopg" in settings.DATABASE_URL or "postgresql" in settings.DATABASE_URL:
    # Short timeout for initial test connectivity
    connect_args["connect_timeout"] = 3

# Configure primary sync engine with dialect fallback
try:
    if settings.DATABASE_URL.startswith("sqlite"):
        engine = create_engine(
            settings.DATABASE_URL,
            echo=False,
            connect_args=connect_args,
        )
    else:
        engine = create_engine(
            settings.DATABASE_URL,
            echo=False,
            pool_pre_ping=True,
            connect_args=connect_args,
        )
except Exception as e:
    logger.warning(
        "Could not initialize primary database engine with '%s': %s. Falling back to local SQLite engine.",
        settings.DATABASE_URL,
        str(e),
    )
    engine = create_engine(
        "sqlite:///./stockiq_fallback.db",
        echo=False,
        connect_args={"check_same_thread": False},
    )

# Automatically create tables for SQLite fallback environments
if engine.url.drivername.startswith("sqlite"):
    try:
        import app.models  # noqa: F401
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        logger.warning("Could not auto-create SQLite tables: %s", str(e))

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# Async engine for asynchronous FastAPI endpoints
try:
    async_db_url = settings.ASYNC_DATABASE_URL or "sqlite+aiosqlite:///./stockiq_fallback.db"
    async_engine = create_async_engine(
        async_db_url,
        pool_pre_ping=True,
    )
    AsyncSessionLocal = async_sessionmaker(
        bind=async_engine,
        autocommit=False,
        autoflush=False,
        expire_on_commit=False,
    )
except Exception:
    async_engine = None
    AsyncSessionLocal = None


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
            "url": settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else settings.DATABASE_URL,
        }
    except Exception as e:
        logger.warning("Database connection check failed: %s", str(e))
        return {
            "status": "disconnected",
            "error": str(e),
        }

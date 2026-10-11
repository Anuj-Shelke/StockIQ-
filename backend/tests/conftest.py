"""Pytest configuration and database fixtures for StockIQ tests."""

import os
import sys
import pytest
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.ext.compiler import compiles
from pgvector.sqlalchemy import Vector

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.db.base import Base


# Register SQLite compilers for PostgreSQL types when running tests with SQLite
@compiles(TSVECTOR, "sqlite")
def compile_tsvector(element, compiler, **kw):
    return "TEXT"


@compiles(Vector, "sqlite")
def compile_vector(element, compiler, **kw):
    return "TEXT"


def is_postgres_available() -> bool:
    """Fast socket probe to check if PostgreSQL server is accepting connections."""
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.5)
    try:
        s.connect((settings.POSTGRES_HOST, settings.POSTGRES_PORT))
        return True
    except Exception:
        return False
    finally:
        s.close()


@pytest.fixture(scope="session")
def test_engine():
    """Create test engine.
    Uses PostgreSQL if running; falls back instantly to SQLite in-memory with PG type shims
    for isolated local test runs when PostgreSQL daemon is not started.
    """
    if is_postgres_available():
        try:
            pg_engine = sa.create_engine(settings.DATABASE_URL, pool_pre_ping=True)
            with pg_engine.connect() as conn:
                conn.execute(sa.text("SELECT 1"))
            return pg_engine
        except Exception:
            pass

    sqlite_engine = sa.create_engine("sqlite:///:memory:", echo=False)
    return sqlite_engine


@pytest.fixture(scope="function")
def db_session(test_engine):
    """Provide a transactional database session for each test function."""
    connection = test_engine.connect()

    # Enable foreign keys for SQLite
    if test_engine.dialect.name == "sqlite":
        connection.execute(sa.text("PRAGMA foreign_keys=ON;"))

    Base.metadata.create_all(bind=connection)

    TestingSession = sessionmaker(
        bind=connection,
        autocommit=False,
        autoflush=False,
        expire_on_commit=False,
    )
    session = TestingSession()

    try:
        yield session
    finally:
        session.rollback()
        session.close()
        Base.metadata.drop_all(bind=connection)
        connection.close()

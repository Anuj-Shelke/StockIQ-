"""Pytest configuration and database fixtures for StockIQ tests."""

import os
import sys
import pytest
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.ext.compiler import compiles
from pgvector.sqlalchemy import Vector
from starlette.testclient import TestClient

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Register SQLite compilers for PostgreSQL types when running tests with SQLite
@compiles(TSVECTOR, "sqlite")
def compile_tsvector(element, compiler, **kw):
    return "TEXT"


@compiles(Vector, "sqlite")
def compile_vector(element, compiler, **kw):
    return "TEXT"


from app.core.config import settings
from app.core.security import create_access_token
from app.db.base import Base
from app.db.session import get_db
import app.models  # noqa: F401
from app.main import app


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


# Shared engine for fast in-memory or Postgres test executions
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine_instance = sa.create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=sa.pool.StaticPool,
)
TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine_instance,
)

# Initialize schema on the test engine
Base.metadata.create_all(bind=test_engine_instance)


def override_get_db():
    """Override get_db dependency for tests with isolated SQLite session."""
    Base.metadata.create_all(bind=test_engine_instance)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def test_engine():
    """Create test engine for integration tests."""
    if is_postgres_available():
        try:
            pg_engine = sa.create_engine(settings.DATABASE_URL, pool_pre_ping=True)
            with pg_engine.connect() as conn:
                conn.execute(sa.text("SELECT 1"))
            return pg_engine
        except Exception:
            pass

    return test_engine_instance


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
        if test_engine.dialect.name != "sqlite":
            Base.metadata.drop_all(bind=connection)
        connection.close()


@pytest.fixture(scope="session")
def client():
    """Test client for FastAPI app."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def auth_headers():
    """Generates valid JWT bearer authorization headers for testing."""
    token = create_access_token(
        subject="test-user-123",
        claims={
            "email": "test@stockiq.example.com",
            "role": "investor",
            "full_name": "Test Investor",
        },
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_auth_headers():
    """Generates valid admin JWT bearer authorization headers for testing."""
    token = create_access_token(
        subject="admin-user-001",
        claims={
            "email": "admin@stockiq.example.com",
            "role": "admin",
            "full_name": "Admin User",
        },
    )
    return {"Authorization": f"Bearer {token}"}

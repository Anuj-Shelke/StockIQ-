"""Pytest configuration and database fixtures for StockIQ tests."""

import os
import sys
import pytest
import sqlalchemy as sa
import uuid

# Prevent test-triggered background tasks from sending real email.
os.environ["TESTING"] = "true"
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
from app.core.security import create_access_token, get_password_hash
from app.db.base import Base
from app.db.session import get_db
from app.models.user import User
import app.models  # noqa: F401
from app.main import app


# Shared engine for fast in-memory or Postgres test executions
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine_instance = sa.create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=sa.pool.StaticPool,
    use_insertmanyvalues=False,
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
    from app.db.session import seed_default_data
    seed_default_data(db)
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def test_engine():
    """Create test engine for integration tests."""
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
def auth_headers(db_session):
    """Generates valid JWT bearer authorization headers for testing."""
    email = f"test-{uuid.uuid4().hex}@stockiq.example.com"
    user = User(
        id=uuid.uuid4(), email=email, password_hash=get_password_hash("TestPass123!"),
        full_name="Test Investor", role="investor", is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    token = create_access_token(
        subject=str(user.id),
        claims={
            "email": email,
            "role": "investor",
            "full_name": "Test Investor",
        },
    )
    return {"Authorization": f"Bearer {token}"}
@pytest.fixture
def admin_auth_headers(db_session):
    """Generates valid admin JWT bearer authorization headers for testing."""
    email = f"admin-{uuid.uuid4().hex}@stockiq.example.com"
    user = User(
        id=uuid.uuid4(), email=email, password_hash=get_password_hash("TestPass123!"),
        full_name="Admin User", role="admin", is_active=True, is_superuser=True,
    )
    db_session.add(user)
    db_session.commit()
    token = create_access_token(
        subject=str(user.id),
        claims={
            "email": email,
            "role": "admin",
            "full_name": "Admin User",
        },
    )
    return {"Authorization": f"Bearer {token}"}

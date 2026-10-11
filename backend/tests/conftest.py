import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from starlette.testclient import TestClient

import app.models  # noqa: F401
from app.core.security import create_access_token
from app.db.base import Base
from app.db.session import get_db
from app.main import app

# Create in-memory SQLite engine for isolated, fast unit testing
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Create all tables in test database
Base.metadata.create_all(bind=test_engine)


def override_get_db():
    """Override get_db dependency for tests with isolated SQLite session."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


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

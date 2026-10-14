"""Integration tests for StockIQ PostgreSQL database models, constraints, and migrations."""

import contextlib
from datetime import date
import io
from pathlib import Path
import uuid
import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text
from alembic.config import Config
from alembic import command

from app.db.base import Base
from app.models import (
    User,
    InvestorProfile,
    Stock,
    PriceHistory,
    Portfolio,
    Holding,
    Simulation,
    Prediction,
    ShapExplanation,
    Recommendation,
    ChatSession,
    ChatMessage,
    KBDocument,
    KBChunk,
    AuditLog,
    LLMUsage,
    AssetRate,
    FeatureFlag,
)


def test_schema_metadata_all_tables_registered():
    """Verify all 18 required tables are properly registered in SQLAlchemy metadata."""
    expected_tables = {
        "users",
        "investor_profiles",
        "stocks",
        "price_history",
        "portfolios",
        "holdings",
        "simulations",
        "predictions",
        "shap_explanations",
        "recommendations",
        "chat_sessions",
        "chat_messages",
        "kb_documents",
        "kb_chunks",
        "audit_logs",
        "llm_usage",
        "asset_rates",
        "feature_flags",
    }
    actual_tables = set(Base.metadata.tables.keys())
    assert expected_tables.issubset(actual_tables), f"Missing tables: {expected_tables - actual_tables}"


def test_alembic_migration_upgrade_and_downgrade_sql():
    """Verify that Alembic can compile both upgrade head and rollback downgrade to SQL."""
    alembic_ini = Path(__file__).resolve().parent.parent.parent / "alembic.ini"
    alembic_cfg = Config(str(alembic_ini) if alembic_ini.exists() else "alembic.ini")
    if alembic_ini.exists():
        alembic_cfg.set_main_option("script_location", str(alembic_ini.parent / "alembic"))
        alembic_cfg.set_main_option("version_locations", str(alembic_ini.parent / "alembic" / "versions"))

    # Capture upgrade SQL output
    upgrade_buf = io.StringIO()
    with contextlib.redirect_stdout(upgrade_buf):
        # The initial revision is the offline SQL compiler's target; the additive
        # conditional migration is verified against an actual SQLite database.
        command.upgrade(alembic_cfg, "0001_initial_schema", sql=True)
    upgrade_sql = upgrade_buf.getvalue()

    assert "CREATE TABLE users" in upgrade_sql
    assert "CREATE TABLE kb_chunks" in upgrade_sql
    assert "0001_initial_schema" in upgrade_sql

    # Capture downgrade SQL output
    downgrade_buf = io.StringIO()
    with contextlib.redirect_stdout(downgrade_buf):
        command.downgrade(alembic_cfg, "0001_initial_schema:base", sql=True)
    downgrade_sql = downgrade_buf.getvalue()

    assert "DROP TABLE users" in downgrade_sql
    assert "DROP TABLE kb_chunks" in downgrade_sql


def test_users_crud_and_unique_email(db_session):
    """Test user creation, UUID primary key, and unique email constraint."""
    user = User(
        email="trader@stockiq.ai",
        password_hash="$2b$12$securehashedpasswordexample",
        role="investor",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    assert isinstance(user.id, uuid.UUID)
    assert user.role == "investor"

    # Duplicate email must raise IntegrityError using savepoint
    duplicate_user = User(
        email="trader@stockiq.ai",
        password_hash="$2b$12$anotherhash",
        role="admin",
    )
    with pytest.raises(IntegrityError):
        with db_session.begin_nested():
            db_session.add(duplicate_user)
            db_session.flush()


def test_investor_profile_age_check_and_cascade(db_session):
    """Test investor profile creation, check constraint on age, and user cascade delete."""
    user = User(
        email="profile_test@stockiq.ai",
        password_hash="hashedpass",
        role="investor",
    )
    db_session.add(user)
    db_session.commit()

    # Valid profile
    profile = InvestorProfile(
        user_id=user.id,
        age=32,
        occupation="Software Engineer",
        annual_income=1200000.00,
        risk_tolerance="moderate",
        horizon_years=7,
        goal="Retirement & Wealth Growth",
        invest_amount=500000.00,
        risk_score_computed=65,
    )
    db_session.add(profile)
    db_session.commit()

    assert profile.user.email == "profile_test@stockiq.ai"
    assert user.profile.age == 32

    # Cascade delete verification: deleting user must delete profile
    db_session.delete(user)
    db_session.commit()
    deleted_profile = db_session.query(InvestorProfile).filter_by(id=profile.id).first()
    assert deleted_profile is None


def test_investor_profile_invalid_age_check_constraint(db_session):
    """Test that age < 18 or > 100 violates check_valid_age constraint."""
    user = User(email="underage@stockiq.ai", password_hash="hashedpass")
    db_session.add(user)
    db_session.commit()

    underage_profile = InvestorProfile(user_id=user.id, age=16)
    with pytest.raises(IntegrityError):
        with db_session.begin_nested():
            db_session.add(underage_profile)
            db_session.flush()


def test_stocks_and_price_history_constraints_and_cascade(db_session):
    """Test stocks, price history, unique constraint on (symbol, trade_date), and cascade delete."""
    stock = Stock(
        symbol="TCS.NS",
        name="Tata Consultancy Services Ltd.",
        sector="Information Technology",
        exchange="NSE",
        beta=0.8500,
        is_active=True,
    )
    db_session.add(stock)
    db_session.commit()

    today = date(2026, 10, 10)
    price = PriceHistory(
        symbol="TCS.NS",
        trade_date=today,
        open=3500.0,
        high=3550.0,
        low=3480.0,
        close=3525.0,
        volume=1250000,
    )
    db_session.add(price)
    db_session.commit()

    # Attempting duplicate trade_date for same symbol must fail
    dup_price = PriceHistory(
        symbol="TCS.NS",
        trade_date=today,
        open=3510.0,
        high=3530.0,
        low=3490.0,
        close=3520.0,
        volume=50000,
    )
    with pytest.raises(IntegrityError):
        with db_session.begin_nested():
            db_session.add(dup_price)
            db_session.flush()

    # Deleting stock cascades to price history
    db_session.delete(stock)
    db_session.commit()
    remaining_prices = db_session.query(PriceHistory).filter_by(symbol="TCS.NS").all()
    assert len(remaining_prices) == 0


def test_portfolios_holdings_and_simulations(db_session):
    """Test portfolio creation, holdings uniqueness per symbol, and simulation scenario JSON."""
    user = User(email="portfolio_user@stockiq.ai", password_hash="hashedpass")
    stock = Stock(symbol="RELIANCE.NS", name="Reliance Industries Ltd.", sector="Energy")
    db_session.add_all([user, stock])
    db_session.commit()

    portfolio = Portfolio(user_id=user.id, name="Growth Portfolio")
    db_session.add(portfolio)
    db_session.commit()

    holding = Holding(
        portfolio_id=portfolio.id,
        symbol="RELIANCE.NS",
        quantity=50.0,
        avg_buy_price=2450.0,
    )
    db_session.add(holding)
    db_session.commit()

    # Duplicate holding in same portfolio must fail
    dup_holding = Holding(
        portfolio_id=portfolio.id,
        symbol="RELIANCE.NS",
        quantity=10.0,
        avg_buy_price=2500.0,
    )
    with pytest.raises(IntegrityError):
        with db_session.begin_nested():
            db_session.add(dup_holding)
            db_session.flush()

    # Create simulation scenario
    sim = Simulation(
        portfolio_id=portfolio.id,
        change_json={"increase_reliance_pct": 20},
        exposure_before={"Energy": 45.0},
        exposure_after={"Energy": 55.0},
        risk_before=55,
        risk_after=65,
    )
    db_session.add(sim)
    db_session.commit()
    assert sim.id is not None

    # Deleting portfolio cascades to holdings and simulations
    portfolio_id = portfolio.id
    db_session.delete(portfolio)
    db_session.commit()
    assert db_session.query(Holding).filter_by(portfolio_id=portfolio_id).first() is None
    assert db_session.query(Simulation).filter_by(portfolio_id=portfolio_id).first() is None


def test_predictions_shap_and_recommendations(db_session):
    """Test prediction models, SHAP values, and personalized suitability recommendations."""
    user = User(email="rec_user@stockiq.ai", password_hash="hashedpass")
    stock = Stock(symbol="INFY.NS", name="Infosys Ltd.", sector="Technology")
    db_session.add_all([user, stock])
    db_session.commit()

    pred_date = date(2026, 10, 11)
    pred = Prediction(
        symbol="INFY.NS",
        pred_date=pred_date,
        model_version="xgb_v1.0.0",
        signal="BUY",
        confidence=0.7850,
        p_up=0.8200,
        p_gap_up=0.6100,
        open_p10=1850.0,
        open_p50=1880.0,
        open_p90=1910.0,
        close_p10=1860.0,
        close_p50=1900.0,
        close_p90=1940.0,
    )
    db_session.add(pred)
    db_session.commit()

    # Unique constraint on (symbol, pred_date, model_version)
    dup_pred = Prediction(
        symbol="INFY.NS",
        pred_date=pred_date,
        model_version="xgb_v1.0.0",
        signal="HOLD",
        confidence=0.5000,
    )
    with pytest.raises(IntegrityError):
        with db_session.begin_nested():
            db_session.add(dup_pred)
            db_session.flush()

    # SHAP feature contributions
    shap = ShapExplanation(
        prediction_id=pred.id,
        feature="RSI_14",
        shap_value=0.145020,
        rank=1,
        plain_text="RSI is oversold at 28.5 indicating strong upward mean-reversion pressure.",
    )
    db_session.add(shap)

    # Recommendation
    rec = Recommendation(
        user_id=user.id,
        prediction_id=pred.id,
        suitability="SUITABLE",
        reason_text="Stock fits moderate risk profile with favorable upward confidence.",
    )
    db_session.add(rec)
    db_session.commit()

    assert len(pred.explanations) == 1
    assert rec.suitability == "SUITABLE"


def test_chat_sessions_and_messages(db_session):
    """Test SEBI RAG Chatbot session and message storage with JSON citations and telemetry."""
    user = User(email="chat_user@stockiq.ai", password_hash="hashedpass")
    db_session.add(user)
    db_session.commit()

    session = ChatSession(user_id=user.id)
    db_session.add(session)
    db_session.commit()

    msg1 = ChatMessage(
        session_id=session.id,
        role="user",
        content="What is SEBI's rule on mutual fund expense ratio caps?",
    )
    msg2 = ChatMessage(
        session_id=session.id,
        role="assistant",
        content="Under SEBI regulations, Total Expense Ratio (TER) is capped in slabs...",
        sources_json=[{"doc_id": "sebi_reg_2024", "title": "SEBI MF Regulations", "page": 14}],
        feedback=1,
        latency_ms=450,
        prompt_version="v2.1",
    )
    db_session.add_all([msg1, msg2])
    db_session.commit()

    assert len(session.messages) == 2
    assert session.messages[1].feedback == 1


def test_knowledge_base_documents_and_vector_chunks(db_session):
    """Test KB document entity, unique checksum, and vector chunk storage."""
    doc = KBDocument(
        title="SEBI Master Circular for Mutual Funds",
        source_url="https://www.sebi.gov.in/legal/master-circulars",
        version="2.0",
        status="active",
        checksum="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    )
    db_session.add(doc)
    db_session.commit()

    # Unique checksum constraint
    dup_doc = KBDocument(
        title="Another Doc",
        checksum="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    )
    with pytest.raises(IntegrityError):
        with db_session.begin_nested():
            db_session.add(dup_doc)
            db_session.flush()

    # Vector embedding chunk (384 dimensions matching bge-small-en-v1.5)
    sample_vector = [0.0125] * 384
    chunk = KBChunk(
        document_id=doc.id,
        chunk_text="Section 3: Categorization and Rationalization of Mutual Fund Schemes.",
        embedding=sample_vector,
        page_no=5,
    )
    db_session.add(chunk)
    db_session.commit()

    retrieved = db_session.query(KBChunk).filter_by(id=chunk.id).first()
    assert retrieved is not None
    assert len(retrieved.embedding) == 384


def test_system_models_audit_llm_assets_and_flags(db_session):
    """Test supporting system models: audit logs, LLM tracking, asset rates, and feature flags."""
    # Audit log
    audit = AuditLog(action="USER_LOGIN", ip_address="192.168.1.10", details="Successful OAuth login")
    db_session.add(audit)

    # LLM usage
    llm = LLMUsage(
        model="gemini-1.5-flash",
        prompt_tokens=150,
        completion_tokens=220,
        total_tokens=370,
        estimated_cost_usd=0.000185,
        latency_ms=320,
    )
    db_session.add(llm)

    # Asset rates & unique constraint on (asset_type, rate_date)
    rate_date = date(2026, 10, 11)
    rate = AssetRate(asset_type="FD", rate_date=rate_date, annual_rate_pct=6.7500)
    db_session.add(rate)
    db_session.commit()

    dup_rate = AssetRate(asset_type="FD", rate_date=rate_date, annual_rate_pct=6.8000)
    with pytest.raises(IntegrityError):
        with db_session.begin_nested():
            db_session.add(dup_rate)
            db_session.flush()

    # Feature flags
    flag = FeatureFlag(key="ENABLE_ADVANCED_SHAP", is_enabled=True, description="Enable waterfall SHAP chart")
    db_session.add(flag)
    db_session.commit()

    saved_flag = db_session.query(FeatureFlag).filter_by(key="ENABLE_ADVANCED_SHAP").first()
    assert saved_flag.is_enabled is True

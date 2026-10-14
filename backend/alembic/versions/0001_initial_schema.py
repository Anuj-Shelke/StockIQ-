"""Initial StockIQ schema with pgvector support

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-10-11 17:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR, UUID
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create all StockIQ relational tables and enable pgvector extension."""
    if op.get_bind().dialect.name == "sqlite":
        # Keep SQLite available for isolated local/test database upgrades.
        import app.models  # noqa: F401
        from app.db.base import Base
        Base.metadata.create_all(bind=op.get_bind())
        return

    # 1. Enable required PostgreSQL extensions
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
    op.execute('CREATE EXTENSION IF NOT EXISTS vector;')

    # 2. Users table
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(50), nullable=False, server_default="investor"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("idx_users_email", "users", ["email"])

    # 3. Investor Profiles table
    op.create_table(
        "investor_profiles",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("age", sa.Integer(), nullable=True),
        sa.Column("occupation", sa.String(100), nullable=True),
        sa.Column("annual_income", sa.Numeric(15, 2), nullable=True),
        sa.Column("risk_tolerance", sa.String(50), nullable=False, server_default="moderate"),
        sa.Column("horizon_years", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("goal", sa.String(255), nullable=True),
        sa.Column("invest_amount", sa.Numeric(15, 2), nullable=True),
        sa.Column("risk_score_computed", sa.Integer(), nullable=True),
        sa.UniqueConstraint("user_id", name="uq_investor_profiles_user_id"),
        sa.CheckConstraint("age >= 18 AND age <= 100", name="check_valid_age"),
    )

    # 4. Stocks table
    op.create_table(
        "stocks",
        sa.Column("symbol", sa.String(20), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("sector", sa.String(100), nullable=True),
        sa.Column("exchange", sa.String(20), nullable=False, server_default="NSE"),
        sa.Column("beta", sa.Numeric(6, 4), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.create_index("idx_stocks_sector", "stocks", ["sector"])

    # 5. Price History table
    op.create_table(
        "price_history",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("symbol", sa.String(20), sa.ForeignKey("stocks.symbol", ondelete="CASCADE"), nullable=False),
        sa.Column("trade_date", sa.Date(), nullable=False),
        sa.Column("open", sa.Numeric(12, 4), nullable=False),
        sa.Column("high", sa.Numeric(12, 4), nullable=False),
        sa.Column("low", sa.Numeric(12, 4), nullable=False),
        sa.Column("close", sa.Numeric(12, 4), nullable=False),
        sa.Column("volume", sa.BigInteger(), nullable=False),
        sa.UniqueConstraint("symbol", "trade_date", name="uq_stock_trade_date"),
    )
    op.create_index("idx_price_history_symbol", "price_history", ["symbol"])
    op.create_index("idx_price_history_trade_date", "price_history", ["trade_date"])

    # 6. Portfolios table
    op.create_table(
        "portfolios",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(100), nullable=False, server_default="Primary Portfolio"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_portfolios_user_id", "portfolios", ["user_id"])

    # 7. Holdings table
    op.create_table(
        "holdings",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("portfolio_id", UUID(as_uuid=True), sa.ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("symbol", sa.String(20), sa.ForeignKey("stocks.symbol", ondelete="CASCADE"), nullable=False),
        sa.Column("quantity", sa.Numeric(12, 4), nullable=False),
        sa.Column("avg_buy_price", sa.Numeric(12, 4), nullable=False),
        sa.UniqueConstraint("portfolio_id", "symbol", name="uq_portfolio_symbol"),
    )
    op.create_index("idx_holdings_portfolio_id", "holdings", ["portfolio_id"])

    # 8. Simulations table
    op.create_table(
        "simulations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("portfolio_id", UUID(as_uuid=True), sa.ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("change_json", JSONB, nullable=False),
        sa.Column("exposure_before", JSONB, nullable=True),
        sa.Column("exposure_after", JSONB, nullable=True),
        sa.Column("risk_before", sa.Integer(), nullable=True),
        sa.Column("risk_after", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_simulations_portfolio_id", "simulations", ["portfolio_id"])

    # 9. Predictions table
    op.create_table(
        "predictions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("symbol", sa.String(20), sa.ForeignKey("stocks.symbol", ondelete="CASCADE"), nullable=False),
        sa.Column("pred_date", sa.Date(), nullable=False),
        sa.Column("model_version", sa.String(50), nullable=False),
        sa.Column("signal", sa.String(20), nullable=False),
        sa.Column("confidence", sa.Numeric(5, 4), nullable=False),
        sa.Column("p_up", sa.Numeric(5, 4), nullable=True),
        sa.Column("p_gap_up", sa.Numeric(5, 4), nullable=True),
        sa.Column("open_p10", sa.Numeric(12, 4), nullable=True),
        sa.Column("open_p50", sa.Numeric(12, 4), nullable=True),
        sa.Column("open_p90", sa.Numeric(12, 4), nullable=True),
        sa.Column("close_p10", sa.Numeric(12, 4), nullable=True),
        sa.Column("close_p50", sa.Numeric(12, 4), nullable=True),
        sa.Column("close_p90", sa.Numeric(12, 4), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("symbol", "pred_date", "model_version", name="uq_stock_pred_version"),
    )
    op.create_index("idx_predictions_symbol", "predictions", ["symbol"])
    op.create_index("idx_predictions_pred_date", "predictions", ["pred_date"])

    # 10. SHAP Explanations table
    op.create_table(
        "shap_explanations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("prediction_id", UUID(as_uuid=True), sa.ForeignKey("predictions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("feature", sa.String(100), nullable=False),
        sa.Column("shap_value", sa.Numeric(10, 6), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("plain_text", sa.Text(), nullable=True),
    )
    op.create_index("idx_shap_explanations_prediction_id", "shap_explanations", ["prediction_id"])

    # 11. Recommendations table
    op.create_table(
        "recommendations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("prediction_id", UUID(as_uuid=True), sa.ForeignKey("predictions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("suitability", sa.String(50), nullable=False),
        sa.Column("reason_text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_recommendations_user_id", "recommendations", ["user_id"])
    op.create_index("idx_recommendations_prediction_id", "recommendations", ["prediction_id"])
    op.create_index("idx_recommendations_user_created", "recommendations", ["user_id", "created_at"])

    # 12. Chat Sessions table
    op.create_table(
        "chat_sessions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_chat_sessions_user_id", "chat_sessions", ["user_id"])

    # 13. Chat Messages table
    op.create_table(
        "chat_messages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("session_id", UUID(as_uuid=True), sa.ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("sources_json", JSONB, nullable=True),
        sa.Column("feedback", sa.SmallInteger(), nullable=True),
        sa.Column("latency_ms", sa.Integer(), nullable=True),
        sa.Column("prompt_version", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_chat_messages_session_id", "chat_messages", ["session_id"])
    op.create_index("idx_chat_messages_session_created", "chat_messages", ["session_id", "created_at"])

    # 14. Knowledge Base Documents table
    op.create_table(
        "kb_documents",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("source_url", sa.Text(), nullable=True),
        sa.Column("version", sa.String(50), nullable=False, server_default="1.0"),
        sa.Column("status", sa.String(50), nullable=False, server_default="active"),
        sa.Column("checksum", sa.String(64), nullable=False),
        sa.Column("uploaded_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("checksum", name="uq_kb_documents_checksum"),
    )

    # 15. Knowledge Base Chunks table (with pgvector embedding)
    op.create_table(
        "kb_chunks",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("document_id", UUID(as_uuid=True), sa.ForeignKey("kb_documents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("chunk_text", sa.Text(), nullable=False),
        sa.Column("embedding", Vector(384), nullable=True),
        sa.Column("page_no", sa.Integer(), nullable=True),
        sa.Column("tsv", TSVECTOR, nullable=True),
    )
    op.create_index("idx_kb_chunks_document_id", "kb_chunks", ["document_id"])
    op.create_index("idx_kb_chunks_tsv", "kb_chunks", ["tsv"], postgresql_using="gin")
    op.create_index(
        "idx_kb_chunks_embedding",
        "kb_chunks",
        ["embedding"],
        postgresql_using="hnsw",
        postgresql_ops={"embedding": "vector_cosine_ops"},
    )

    # 16. Audit Logs table
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_audit_logs_user_id", "audit_logs", ["user_id"])
    op.create_index("idx_audit_logs_created_at", "audit_logs", ["created_at"])

    # 17. LLM Usage table
    op.create_table(
        "llm_usage",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("model", sa.String(100), nullable=False),
        sa.Column("prompt_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completion_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("estimated_cost_usd", sa.Numeric(10, 6), nullable=False, server_default="0.0"),
        sa.Column("latency_ms", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_llm_usage_user_id", "llm_usage", ["user_id"])
    op.create_index("idx_llm_usage_created_at", "llm_usage", ["created_at"])

    # 18. Asset Rates table
    op.create_table(
        "asset_rates",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("asset_type", sa.String(50), nullable=False),
        sa.Column("rate_date", sa.Date(), nullable=False),
        sa.Column("annual_rate_pct", sa.Numeric(6, 4), nullable=False),
        sa.UniqueConstraint("asset_type", "rate_date", name="uq_asset_rate_date"),
    )
    op.create_index("idx_asset_rates_rate_date", "asset_rates", ["rate_date"])

    # 19. Feature Flags table
    op.create_table(
        "feature_flags",
        sa.Column("key", sa.String(100), primary_key=True),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("description", sa.String(255), nullable=True),
    )


def downgrade() -> None:
    """Drop all StockIQ tables and disable pgvector extension."""
    op.drop_table("feature_flags")
    op.drop_table("asset_rates")
    op.drop_table("llm_usage")
    op.drop_table("audit_logs")
    op.drop_table("kb_chunks")
    op.drop_table("kb_documents")
    op.drop_table("chat_messages")
    op.drop_table("chat_sessions")
    op.drop_table("recommendations")
    op.drop_table("shap_explanations")
    op.drop_table("predictions")
    op.drop_table("simulations")
    op.drop_table("holdings")
    op.drop_table("portfolios")
    op.drop_table("price_history")
    op.drop_table("stocks")
    op.drop_table("investor_profiles")
    op.drop_table("users")

    op.execute("DROP EXTENSION IF EXISTS vector CASCADE;")
    op.execute('DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;')

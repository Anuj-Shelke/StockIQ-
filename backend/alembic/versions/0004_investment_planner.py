"""AI Personal Investment Planner profiles and plan records tables.

Revision ID: 0004_investment_planner
Revises: 0003_tax_intelligence
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0004_investment_planner"
down_revision: Union[str, Sequence[str], None] = "0003_tax_intelligence"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name
    uuid_type = UUID(as_uuid=True) if dialect == "postgresql" else sa.CHAR(36)

    existing_tables = sa.inspect(bind).get_table_names()

    if "planner_profiles" not in existing_tables:
        op.create_table(
            "planner_profiles",
            sa.Column("id", uuid_type, primary_key=True),
            sa.Column("user_id", uuid_type, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("age", sa.Numeric(5, 0), nullable=False),
            sa.Column("occupation", sa.String(100), nullable=True),
            sa.Column("monthly_income", sa.Numeric(15, 2), nullable=False),
            sa.Column("monthly_expenses", sa.Numeric(15, 2), nullable=False),
            sa.Column("monthly_savings", sa.Numeric(15, 2), nullable=False),
            sa.Column("emergency_fund", sa.Numeric(15, 2), server_default="0.0"),
            sa.Column("existing_investments", sa.Numeric(15, 2), server_default="0.0"),
            sa.Column("debt_obligations", sa.Numeric(15, 2), server_default="0.0"),
            sa.Column("financial_dependents", sa.Numeric(3, 0), server_default="0"),
            sa.Column("current_investable_capital", sa.Numeric(15, 2), nullable=False),
            sa.Column("primary_goal", sa.String(100), nullable=False),
            sa.Column("target_amount", sa.Numeric(15, 2), nullable=True),
            sa.Column("target_years", sa.Numeric(5, 1), server_default="5.0"),
            sa.Column("investment_horizon_category", sa.String(50), server_default="3-5 years"),
            sa.Column("risk_tolerance", sa.String(50), server_default="Moderate"),
            sa.Column("required_liquidity", sa.String(50), server_default="Moderate"),
            sa.Column("max_acceptable_loss_pct", sa.Numeric(5, 2), server_default="15.0"),
            sa.Column("investment_style", sa.String(50), server_default="LUMP_SUM"),
            sa.Column("monthly_sip_amount", sa.Numeric(15, 2), server_default="0.0"),
            sa.Column("preferred_asset_classes", sa.JSON(), nullable=True),
            sa.Column("preferred_sectors", sa.JSON(), nullable=True),
            sa.Column("preferred_stocks", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        )

    if "investment_plans" not in existing_tables:
        op.create_table(
            "investment_plans",
            sa.Column("id", uuid_type, primary_key=True),
            sa.Column("user_id", uuid_type, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("profile_id", uuid_type, sa.ForeignKey("planner_profiles.id", ondelete="SET NULL"), nullable=True),
            sa.Column("plan_name", sa.String(200), server_default="Personalized Investment Plan"),
            sa.Column("status", sa.String(50), server_default="ACTIVE"),
            sa.Column("profile_snapshot", sa.JSON(), nullable=False),
            sa.Column("suitability_assessment", sa.JSON(), nullable=False),
            sa.Column("asset_allocation", sa.JSON(), nullable=False),
            sa.Column("stock_allocations", sa.JSON(), nullable=False),
            sa.Column("fd_plan", sa.JSON(), nullable=False),
            sa.Column("gold_plan", sa.JSON(), nullable=False),
            sa.Column("wealth_projections", sa.JSON(), nullable=False),
            sa.Column("risk_metrics", sa.JSON(), nullable=False),
            sa.Column("tax_estimates", sa.JSON(), nullable=False),
            sa.Column("timeline_milestones", sa.JSON(), nullable=False),
            sa.Column("alternative_portfolios", sa.JSON(), nullable=False),
            sa.Column("explainability_insights", sa.JSON(), nullable=False),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        )


def downgrade() -> None:
    op.drop_table("investment_plans")
    op.drop_table("planner_profiles")

"""Tax intelligence transactions and calculation audit tables.

Revision ID: 0003_tax_intelligence
Revises: 0002_auth_admin_reviews
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0003_tax_intelligence"
down_revision: Union[str, Sequence[str], None] = "0002_auth_admin_reviews"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _columns(table: str) -> dict[str, dict]:
    inspector = sa.inspect(op.get_bind())
    if table not in inspector.get_table_names():
        return {}
    return {col["name"]: col for col in inspector.get_columns(table)}


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name
    uuid_type = UUID(as_uuid=True) if dialect == "postgresql" else sa.CHAR(36)

    existing_tables = sa.inspect(bind).get_table_names()

    if "tax_transactions" not in existing_tables:
        op.create_table(
            "tax_transactions",
            sa.Column("id", uuid_type, primary_key=True),
            sa.Column("user_id", uuid_type, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("portfolio_id", uuid_type, sa.ForeignKey("portfolios.id", ondelete="SET NULL"), nullable=True, index=True),
            sa.Column("symbol", sa.String(20), nullable=False, index=True),
            sa.Column("asset_category", sa.String(50), nullable=False, server_default="LISTED_EQUITY"),
            sa.Column("exchange", sa.String(20), nullable=False, server_default="NSE"),
            sa.Column("purchase_date", sa.Date(), nullable=True),
            sa.Column("purchase_price", sa.Numeric(12, 4), nullable=False),
            sa.Column("quantity", sa.Numeric(12, 4), nullable=False),
            sa.Column("sale_date", sa.Date(), nullable=True),
            sa.Column("sale_price", sa.Numeric(12, 4), nullable=True),
            sa.Column("eligible_expenses", sa.Numeric(12, 4), nullable=False, server_default="0.0"),
            sa.Column("ineligible_expenses", sa.Numeric(12, 4), nullable=False, server_default="0.0"),
            sa.Column("financial_year", sa.String(20), nullable=False, index=True),
            sa.Column("is_realized", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        )

    if "tax_calculation_records" not in existing_tables:
        op.create_table(
            "tax_calculation_records",
            sa.Column("id", uuid_type, primary_key=True),
            sa.Column("user_id", uuid_type, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("financial_year", sa.String(20), nullable=False, index=True),
            sa.Column("asset_symbol", sa.String(20), nullable=False, index=True),
            sa.Column("transaction_details", sa.JSON(), nullable=False),
            sa.Column("calculation_inputs", sa.JSON(), nullable=False),
            sa.Column("calculated_gains", sa.JSON(), nullable=False),
            sa.Column("tax_category", sa.String(50), nullable=False),
            sa.Column("tax_rule_version", sa.String(50), nullable=False),
            sa.Column("estimated_tax", sa.Numeric(15, 2), nullable=False, server_default="0.0"),
            sa.Column("estimated_after_tax_profit", sa.Numeric(15, 2), nullable=False, server_default="0.0"),
            sa.Column("relevant_assumptions", sa.JSON(), nullable=True),
            sa.Column("missing_information_warnings", sa.JSON(), nullable=True),
            sa.Column("explanation_snapshot", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )


def downgrade() -> None:
    bind = op.get_bind()
    existing_tables = sa.inspect(bind).get_table_names()
    if "tax_calculation_records" in existing_tables:
        op.drop_table("tax_calculation_records")
    if "tax_transactions" in existing_tables:
        op.drop_table("tax_transactions")

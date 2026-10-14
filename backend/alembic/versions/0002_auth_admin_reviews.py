"""Additive auth fields and persistent review workflow.

Revision ID: 0002_auth_admin_reviews
Revises: 0001_initial_schema
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0002_auth_admin_reviews"
down_revision: Union[str, Sequence[str], None] = "0001_initial_schema"
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
    user_columns = _columns("users")
    if user_columns:
        additions = [
            ("full_name", sa.Column("full_name", sa.String(255), nullable=True)),
            ("is_superuser", sa.Column("is_superuser", sa.Boolean(), nullable=False, server_default=sa.false())),
            ("updated_at", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True)),
        ]
        missing = [column for name, column in additions if name not in user_columns]
        if missing:
            with op.batch_alter_table("users", recreate="auto") as batch:
                for column in missing:
                    batch.add_column(column)

    review_columns = _columns("review_requests")
    if not review_columns:
        op.create_table(
            "review_requests",
            sa.Column("id", sa.String(50), primary_key=True),
            sa.Column("user_id", UUID(as_uuid=True) if dialect == "postgresql" else sa.String(36), nullable=True),
            sa.Column("user_email", sa.String(255), nullable=False),
            sa.Column("symbol", sa.String(32), nullable=False),
            sa.Column("analysis_snapshot_id", sa.String(128), nullable=True),
            sa.Column("reason", sa.String(255), nullable=False),
            sa.Column("user_notes", sa.Text(), nullable=False),
            sa.Column("status", sa.String(32), nullable=False, server_default="PENDING"),
            sa.Column("severity", sa.String(32), nullable=False, server_default="MEDIUM"),
            sa.Column("assigned_reviewer", sa.String(255), nullable=True),
            sa.Column("reviewer_id", UUID(as_uuid=True) if dialect == "postgresql" else sa.String(36), nullable=True),
            sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("resolution_notes", sa.Text(), nullable=True),
            sa.Column("snapshot_data", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        )
        review_columns = _columns("review_requests")
    else:
        # Existing full_schema.sql deployments use UUID ids and older review field names.
        if "id" in review_columns and not isinstance(review_columns["id"]["type"], sa.String):
            if dialect == "sqlite":
                with op.batch_alter_table("review_requests", recreate="always") as batch:
                    batch.alter_column("id", existing_type=review_columns["id"]["type"], type_=sa.String(50))
            elif dialect == "postgresql":
                op.alter_column(
                    "review_requests", "id", existing_type=review_columns["id"]["type"],
                    type_=sa.String(50), postgresql_using="id::text", server_default=None,
                )

        additions = [
            ("user_email", sa.Column("user_email", sa.String(255), nullable=False, server_default="")),
            ("symbol", sa.Column("symbol", sa.String(32), nullable=False, server_default="UNKNOWN")),
            ("analysis_snapshot_id", sa.Column("analysis_snapshot_id", sa.String(128), nullable=True)),
            ("user_notes", sa.Column("user_notes", sa.Text(), nullable=False, server_default="")),
            ("assigned_reviewer", sa.Column("assigned_reviewer", sa.String(255), nullable=True)),
            ("reviewer_id", sa.Column("reviewer_id", UUID(as_uuid=True) if dialect == "postgresql" else sa.String(36), nullable=True)),
            ("reviewed_at", sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True)),
            ("resolution_notes", sa.Column("resolution_notes", sa.Text(), nullable=True)),
            ("snapshot_data", sa.Column("snapshot_data", sa.JSON(), nullable=True)),
        ]
        missing = [column for name, column in additions if name not in review_columns]
        if missing:
            with op.batch_alter_table("review_requests", recreate="auto") as batch:
                for column in missing:
                    batch.add_column(column)

        current = _columns("review_requests")
        if "asset" in current:
            op.execute(sa.text("UPDATE review_requests SET symbol = asset WHERE symbol = 'UNKNOWN'"))
        if "reviewer_notes" in current:
            op.execute(sa.text("UPDATE review_requests SET resolution_notes = reviewer_notes WHERE resolution_notes IS NULL"))
        if "reason" in current:
            op.execute(sa.text("UPDATE review_requests SET user_notes = reason WHERE user_notes = ''"))
        if "users" in sa.inspect(bind).get_table_names():
            op.execute(sa.text(
                "UPDATE review_requests SET user_email = (SELECT email FROM users WHERE users.id = review_requests.user_id) "
                "WHERE user_email = ''"
            ))

    current = _columns("review_requests")
    for name, columns in (
        ("ix_review_requests_user_id", ["user_id"]),
        ("ix_review_requests_symbol", ["symbol"]),
        ("ix_review_requests_analysis_snapshot_id", ["analysis_snapshot_id"]),
        ("ix_review_requests_status", ["status"]),
    ):
        existing_indexes = {idx["name"] for idx in sa.inspect(bind).get_indexes("review_requests")}
        if name not in existing_indexes and all(column in current for column in columns):
            op.create_index(name, "review_requests", columns)

    existing_indexes = {idx["name"] for idx in sa.inspect(bind).get_indexes("review_requests")}
    if "uq_review_active_analysis_user" not in existing_indexes:
        predicate = sa.text("status IN ('PENDING', 'IN_REVIEW') AND analysis_snapshot_id IS NOT NULL")
        op.create_index(
            "uq_review_active_analysis_user", "review_requests", ["user_id", "analysis_snapshot_id"],
            unique=True, sqlite_where=predicate, postgresql_where=predicate,
        )


def downgrade() -> None:
    # Deliberately non-destructive: review history and auth fields may contain user data.
    pass

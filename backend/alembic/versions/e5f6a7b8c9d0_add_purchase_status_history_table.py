"""add purchase status history table

Revision ID: e5f6a7b8c9d0
Revises: d2e3f4a5b6c7
Create Date: 2026-04-20 12:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "e5f6a7b8c9d0"
down_revision: str | Sequence[str] | None = "d2e3f4a5b6c7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "purchase_status_history",
        sa.Column("history_id", sa.Integer(), nullable=False),
        sa.Column("purchase_id", sa.Integer(), nullable=False),
        sa.Column("from_status", sa.String(length=20), nullable=True),
        sa.Column("to_status", sa.String(length=20), nullable=False),
        sa.Column(
            "changed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("changed_by_user_id", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint(
            "history_id", name=op.f("pk_purchase_status_history")
        ),
        sa.ForeignKeyConstraint(
            ["purchase_id"],
            ["purchases.purchase_id"],
            name=op.f("fk_purchase_status_history_purchase_id_purchases"),
        ),
        sa.ForeignKeyConstraint(
            ["changed_by_user_id"],
            ["users.user_id"],
            name=op.f("fk_purchase_status_history_changed_by_user_id_users"),
        ),
    )


def downgrade() -> None:
    op.drop_table("purchase_status_history")

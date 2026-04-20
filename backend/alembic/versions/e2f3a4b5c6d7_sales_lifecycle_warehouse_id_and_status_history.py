"""sales lifecycle: status history table

Revision ID: e2f3a4b5c6d7
Revises: eb636a9414e3
Create Date: 2026-04-14 00:00:00.000000

warehouse_id was already added to sales in b2c3d4e5f6a7.
This migration only creates the sale_status_history table.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "e2f3a4b5c6d7"
down_revision: str | Sequence[str] | None = "eb636a9414e3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "sale_status_history",
        sa.Column("history_id", sa.Integer(), nullable=False),
        sa.Column("sale_id", sa.Integer(), nullable=False),
        sa.Column("from_status", sa.String(length=20), nullable=True),
        sa.Column("to_status", sa.String(length=20), nullable=False),
        sa.Column(
            "changed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("changed_by_user_id", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint("history_id", name=op.f("pk_sale_status_history")),
        sa.ForeignKeyConstraint(
            ["sale_id"],
            ["sales.sale_id"],
            name=op.f("fk_sale_status_history_sale_id_sales"),
        ),
        sa.ForeignKeyConstraint(
            ["changed_by_user_id"],
            ["users.user_id"],
            name=op.f("fk_sale_status_history_changed_by_user_id_users"),
        ),
    )


def downgrade() -> None:
    op.drop_table("sale_status_history")

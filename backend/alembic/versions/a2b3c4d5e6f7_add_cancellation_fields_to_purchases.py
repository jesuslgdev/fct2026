"""add cancellation fields to purchases

Revision ID: a2b3c4d5e6f7
Revises: e1f2a3b4c5d6
Create Date: 2026-04-06 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "a2b3c4d5e6f7"
down_revision: str | None = "e1f2a3b4c5d6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "purchases",
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "purchases",
        sa.Column("cancelled_by_user_id", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("purchases", "cancelled_by_user_id")
    op.drop_column("purchases", "cancelled_at")

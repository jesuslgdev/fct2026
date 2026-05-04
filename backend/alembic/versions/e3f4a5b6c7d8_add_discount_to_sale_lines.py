"""add discount to sale_lines

Revision ID: e3f4a5b6c7d8
Revises: d2e3f4a5b6c7
Create Date: 2026-04-20 13:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "e3f4a5b6c7d8"
down_revision: str | Sequence[str] | None = "d2e3f4a5b6c7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "sale_lines",
        sa.Column(
            "discount",
            sa.Numeric(precision=5, scale=4),
            nullable=False,
            server_default="0",
        ),
    )
    op.alter_column("sale_lines", "discount", server_default=None)


def downgrade() -> None:
    op.drop_column("sale_lines", "discount")

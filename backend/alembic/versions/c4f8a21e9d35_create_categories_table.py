"""create_categories_table

Revision ID: c4f8a21e9d35
Revises: 3c7a1f9e2b84
Create Date: 2026-03-12 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c4f8a21e9d35"
down_revision: str | Sequence[str] | None = "3c7a1f9e2b84"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create the categories table."""
    op.create_table(
        "categories",
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column(
            "description", sa.String(length=500), nullable=False, server_default=""
        ),
        sa.PrimaryKeyConstraint("category_id", name=op.f("pk_categories")),
        sa.UniqueConstraint("name", name=op.f("uq_categories_name")),
    )


def downgrade() -> None:
    """Drop the categories table."""
    op.drop_table("categories")

"""rename address columns to street

Revision ID: b7d1e2f3a4c5
Revises: 9f3b2c1d4e6a
Create Date: 2026-04-08

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b7d1e2f3a4c5"
down_revision: str | Sequence[str] | None = "9f3b2c1d4e6a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column(
        "clients",
        "address",
        new_column_name="street",
        existing_type=sa.String(length=300),
        existing_nullable=False,
    )
    op.alter_column(
        "suppliers",
        "address",
        new_column_name="street",
        existing_type=sa.String(length=300),
        existing_nullable=False,
    )
    op.alter_column(
        "warehouses",
        "address",
        new_column_name="street",
        existing_type=sa.String(length=255),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "warehouses",
        "street",
        new_column_name="address",
        existing_type=sa.String(length=255),
        existing_nullable=False,
    )
    op.alter_column(
        "suppliers",
        "street",
        new_column_name="address",
        existing_type=sa.String(length=300),
        existing_nullable=False,
    )
    op.alter_column(
        "clients",
        "street",
        new_column_name="address",
        existing_type=sa.String(length=300),
        existing_nullable=False,
    )

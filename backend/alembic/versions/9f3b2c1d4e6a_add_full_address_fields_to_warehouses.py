"""add full address fields to warehouses

Revision ID: 9f3b2c1d4e6a
Revises: e1f2a3b4c5d6
Create Date: 2026-04-08

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "9f3b2c1d4e6a"
down_revision: str | Sequence[str] | None = "e1f2a3b4c5d6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "warehouses",
        sa.Column("city", sa.String(length=100), nullable=False, server_default=""),
    )
    op.add_column(
        "warehouses",
        sa.Column("province", sa.String(length=100), nullable=False, server_default=""),
    )
    op.add_column(
        "warehouses",
        sa.Column(
            "postal_code",
            sa.String(length=10),
            nullable=False,
            server_default="",
        ),
    )

    # Backfill from previous single-string storage.
    # If rows were temporarily saved as "street||city||province||postal_code",
    # split them into proper columns and keep only street in "address".
    op.execute(
        """
        UPDATE warehouses
        SET
            city = CASE
                WHEN POSITION('||' IN address) > 0 THEN SPLIT_PART(address, '||', 2)
                ELSE ''
            END,
            province = CASE
                WHEN POSITION('||' IN address) > 0 THEN SPLIT_PART(address, '||', 3)
                ELSE ''
            END,
            postal_code = CASE
                WHEN POSITION('||' IN address) > 0 THEN SPLIT_PART(address, '||', 4)
                ELSE ''
            END,
            address = CASE
                WHEN POSITION('||' IN address) > 0 THEN SPLIT_PART(address, '||', 1)
                ELSE address
            END
        """
    )

    op.alter_column("warehouses", "city", server_default=None)
    op.alter_column("warehouses", "province", server_default=None)
    op.alter_column("warehouses", "postal_code", server_default=None)


def downgrade() -> None:
    # Preserve information when going back to a single-string address format.
    op.execute(
        """
        UPDATE warehouses
        SET address = address || '||' || city || '||' || province || '||' || postal_code
        """
    )
    op.drop_column("warehouses", "postal_code")
    op.drop_column("warehouses", "province")
    op.drop_column("warehouses", "city")

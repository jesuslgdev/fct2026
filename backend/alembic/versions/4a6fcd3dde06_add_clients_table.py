"""add clients table

Revision ID: 4a6fcd3dde06
Revises: bea4c4d77e2b
Create Date: 2026-03-10 00:00:00.000000

Creates the `clients` table for the HU-07 Clients module.
Chains from bea4c4d77e2b (suppliers table).
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "4a6fcd3dde06"
down_revision: str | Sequence[str] | None = "bea4c4d77e2b"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create the clients table.

    Constraint naming follows the project convention using op.f() so that
    Alembic can auto-generate the correct name for each backend (e.g. PostgreSQL).
    """
    op.create_table(
        "clients",
        # Primary key
        sa.Column("client_id", sa.Integer(), nullable=False),
        # Legal / contact info
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column(
            "tax_id", sa.String(length=20), nullable=False
        ),  # NIF/NIE/CIF, unique
        # Address
        sa.Column("address", sa.String(length=300), nullable=False),
        sa.Column("city", sa.String(length=100), nullable=False),
        sa.Column("province", sa.String(length=100), nullable=False),
        sa.Column("postal_code", sa.String(length=10), nullable=False),
        # Contact
        sa.Column("phone", sa.String(length=20), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        # Soft-delete flag
        sa.Column("is_active", sa.Boolean(), nullable=False),
        # Audit timestamps — set by the database, not the application
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        # Constraints
        sa.PrimaryKeyConstraint("client_id", name=op.f("pk_clients")),
        sa.UniqueConstraint("tax_id", name=op.f("uq_clients_tax_id")),
    )


def downgrade() -> None:
    """Drop the clients table, reverting this migration."""
    op.drop_table("clients")

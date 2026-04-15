"""add unique constraint to clients email

Revision ID: 9d1e2f3a4b5c
Revises: 80f43570db6f
Create Date: 2026-04-08 11:15:00.000000

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "9d1e2f3a4b5c"
down_revision: str | Sequence[str] | None = "80f43570db6f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add unique constraint on clients.email."""
    op.create_unique_constraint(op.f("uq_clients_email"), "clients", ["email"])


def downgrade() -> None:
    """Drop unique constraint on clients.email."""
    op.drop_constraint(op.f("uq_clients_email"), "clients", type_="unique")

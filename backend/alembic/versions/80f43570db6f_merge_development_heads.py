"""merge development heads

Revision ID: 80f43570db6f
Revises: d4e5f6a7b8c9, d9e1f2a3b4c6
Create Date: 2026-04-13 11:43:40.449318

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "80f43570db6f"
down_revision: str | Sequence[str] | None = ("d4e5f6a7b8c9", "d9e1f2a3b4c6")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

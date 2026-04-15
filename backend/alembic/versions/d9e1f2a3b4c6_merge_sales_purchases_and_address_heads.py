"""merge sales, purchases cancellation and shared-address heads

Revision ID: d9e1f2a3b4c6
Revises: a1b2c3d4e5f7, a2b3c4d5e6f7, b7d1e2f3a4c5
Create Date: 2026-04-13 09:45:00.000000

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "d9e1f2a3b4c6"
down_revision: str | Sequence[str] | None = (
    "a1b2c3d4e5f7",
    "a2b3c4d5e6f7",
    "b7d1e2f3a4c5",
)
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

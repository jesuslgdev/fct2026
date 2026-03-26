"""merge warehouse and purchases heads

Revision ID: c5d6e7f8a9b0
Revises: b3c4d5e6f7a8, b5c6d7e8f9a0
Create Date: 2026-03-26 10:54:29.358876

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "c5d6e7f8a9b0"
down_revision: str | Sequence[str] | None = ("b3c4d5e6f7a8", "b5c6d7e8f9a0")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

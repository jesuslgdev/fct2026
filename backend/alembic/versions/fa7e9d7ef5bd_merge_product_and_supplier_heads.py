"""merge product and supplier heads

Revision ID: fa7e9d7ef5bd
Revises: a1b2c3d4e5f6, 6420ed7a69c6
Create Date: 2026-03-16 13:39:50.947191

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "fa7e9d7ef5bd"
down_revision: str | Sequence[str] | None = ("a1b2c3d4e5f6", "6420ed7a69c6")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

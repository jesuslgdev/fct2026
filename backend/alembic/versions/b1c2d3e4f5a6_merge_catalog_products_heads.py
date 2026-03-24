"""merge catalog products heads

Revision ID: b1c2d3e4f5a6
Revises: e3f4a5b6c7d8, 6420ed7a69c6
Create Date: 2026-03-24

"""

from collections.abc import Sequence

revision: str = "b1c2d3e4f5a6"
down_revision: tuple[str, str] = ("e3f4a5b6c7d8", "6420ed7a69c6")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

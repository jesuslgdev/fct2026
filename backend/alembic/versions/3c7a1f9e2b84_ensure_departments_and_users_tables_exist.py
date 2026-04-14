"""ensure_departments_and_users_tables_exist

Repair migration: recreates departments and users tables if they were lost
while alembic_version already pointed to head (e.g. after a DB reset).
Uses existence checks so it is a no-op when the tables are already present.

Revision ID: 3c7a1f9e2b84
Revises: 890e4ffe7ec7
Create Date: 2026-03-10 08:35:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "3c7a1f9e2b84"
down_revision: str | Sequence[str] | None = "890e4ffe7ec7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Idempotently ensure departments and users tables exist."""
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    existing = set(inspector.get_table_names())

    if "departments" not in existing:
        op.create_table(
            "departments",
            sa.Column("department_id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(length=100), nullable=False),
            sa.PrimaryKeyConstraint("department_id", name=op.f("pk_departments")),
            sa.UniqueConstraint("name", name=op.f("uq_departments_name")),
        )

    if "users" not in existing:
        op.create_table(
            "users",
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("first_name", sa.String(length=100), nullable=False),
            sa.Column("last_name", sa.String(length=150), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=False),
            sa.Column("role", sa.String(length=50), nullable=False),
            sa.Column("department_id", sa.Integer(), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False),
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
            sa.ForeignKeyConstraint(
                ["department_id"],
                ["departments.department_id"],
                name=op.f("fk_users_department_id_departments"),
            ),
            sa.PrimaryKeyConstraint("user_id", name=op.f("pk_users")),
            sa.UniqueConstraint("email", name=op.f("uq_users_email")),
        )


def downgrade() -> None:
    """No-op: table removal is handled by the original 890e4ffe7ec7 migration."""
    pass

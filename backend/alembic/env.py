# Alembic migration environment.
# This file is executed by Alembic every time a migration command is run
# (e.g. `alembic upgrade head`, `alembic revision --autogenerate`).
# It wires together the app's settings, the SQLAlchemy metadata, and the
# async engine so migrations work with the async psycopg3 driver.
import asyncio
import selectors
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

import modules.admin.domain.entities.department  # noqa: F401
import modules.suppliers.domain.entities.supplier  # noqa: F401
import shared.domain.entities.user  # noqa: F401 — register model with Base.metadata
from alembic import context
from shared.config import settings
from shared.infrastructure.database.base_model import Base

# Alembic Config object — provides access to values in alembic.ini
config = context.config

# Configure Python logging using the [loggers] section of alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Override the static placeholder URL in alembic.ini with the real one from .env
config.set_main_option("sqlalchemy.url", settings.database_url)

# Metadata from all ORM models; used by --autogenerate to diff against the DB
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations without an active DB connection (generates raw SQL)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    """Execute migrations using an existing synchronous connection handle."""
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations against a live database using the async engine.
    NullPool is used so the engine does not keep connections open after migration."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        # run_sync bridges the async connection to the sync Alembic context
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    # SelectorEventLoop is required on Windows to avoid compatibility issues
    # with asyncio and the psycopg3 async driver
    asyncio.run(
        run_migrations_online(),
        loop_factory=lambda: asyncio.SelectorEventLoop(selectors.SelectSelector()),
    )

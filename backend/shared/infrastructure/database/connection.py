# Database engine and session factory for async SQLAlchemy.
# Use get_db() as a FastAPI dependency to inject a session per request.
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from shared.config import settings

# Async engine built from the DATABASE_URL env variable.
engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
)

# Session factory that produces AsyncSession instances.
# expire_on_commit=False keeps ORM objects usable after a commit
# without issuing extra SELECT queries.
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

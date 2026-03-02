# Database engine and session factory for async SQLAlchemy.
# Use get_db() as a FastAPI dependency to inject a session per request.
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from shared.config import settings

# Async engine built from the DATABASE_URL env variable.
# echo=True logs all generated SQL statements — disable in production.
engine = create_async_engine(settings.database_url, echo=True)

# Session factory that produces AsyncSession instances.
# expire_on_commit=False keeps ORM objects usable after a commit
# without issuing extra SELECT queries.
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
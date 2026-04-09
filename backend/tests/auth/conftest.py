import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from main import app
from shared.infrastructure.database.connection import get_db


@pytest_asyncio.fixture
async def auth_client(db_session: AsyncSession):
    """AsyncClient with the test DB session but no auth override.

    Use this fixture to test endpoints that handle their own authentication
    (e.g. POST /auth/login). The get_db dependency is overridden so that
    all use cases within the request share the same auto-rollback session.
    """

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    del app.dependency_overrides[get_db]

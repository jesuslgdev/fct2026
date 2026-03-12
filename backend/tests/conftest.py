import asyncio
import selectors
import sys

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from composition.security import get_current_user
from main import app
from shared.infrastructure.database.connection import engine, get_db


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    if sys.platform == "win32":
        loop = asyncio.SelectorEventLoop(selectors.SelectSelector())
    else:
        loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def db_session():
    async with engine.begin() as conn:
        async with AsyncSession(bind=conn, expire_on_commit=False) as session:
            yield session
            await conn.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    def override_get_current_user():
        return {"email": "admin@test.com", "role": "Administrator"}

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    del app.dependency_overrides[get_db]
    del app.dependency_overrides[get_current_user]


@pytest_asyncio.fixture
async def unauthenticated_client():
    saved = app.dependency_overrides.pop(get_current_user, None)
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    if saved is not None:
        app.dependency_overrides[get_current_user] = saved

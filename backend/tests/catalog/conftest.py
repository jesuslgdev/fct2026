import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from composition.security import get_current_user, require_admin
from main import app
from shared.domain.entities.user_session import UserSession
from shared.infrastructure.database.connection import get_db


@pytest_asyncio.fixture
async def admin_client(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    def override_require_admin():
        return UserSession(
            email="admin@test.com",
            role="Administrator",
            department_id=None,
            firebase_uid="test-uid",
            name="Admin Test",
        )

    def override_get_current_user():
        return UserSession(
            email="admin@test.com",
            role="Administrator",
            department_id=None,
            firebase_uid="test-uid",
            name="Admin Test",
        )

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[require_admin] = override_require_admin
    app.dependency_overrides[get_current_user] = override_get_current_user

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    del app.dependency_overrides[get_db]
    del app.dependency_overrides[require_admin]
    del app.dependency_overrides[get_current_user]


@pytest_asyncio.fixture
async def non_admin_client(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    def override_get_current_user():
        return UserSession(
            email="manager@test.com",
            role="Manager",
            department_id=None,
            firebase_uid="test-uid-2",
            name="Manager Test",
        )

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    del app.dependency_overrides[get_db]
    del app.dependency_overrides[get_current_user]

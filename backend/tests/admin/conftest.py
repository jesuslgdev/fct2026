import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from composition.security import get_current_user, require_admin
from main import app
from shared.domain.dtos.user_session import UserSession
from shared.infrastructure.database.connection import get_db


@pytest_asyncio.fixture
async def admin_client(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    def override_require_admin():
        return UserSession(
            user_id=1,
            email="admin@test.com",
            role="Administrator",
            department_id=None,
            firebase_uid="test-uid",
            name="Admin Test",
            last_login_at=None,
        )

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[require_admin] = override_require_admin

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    del app.dependency_overrides[get_db]
    del app.dependency_overrides[require_admin]


@pytest_asyncio.fixture
async def non_admin_client(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    def override_get_current_user():
        return UserSession(
            user_id=2,
            email="manager@test.com",
            role="Manager",
            department_id=None,
            firebase_uid="test-uid-2",
            name="Manager Test",
            last_login_at=None,
        )

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    del app.dependency_overrides[get_db]
    del app.dependency_overrides[get_current_user]

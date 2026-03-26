import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from composition.security import get_current_user, require_sales_manager_or_admin
from main import app
from shared.domain.entities.user_session import UserSession
from shared.infrastructure.database.connection import get_db


@pytest_asyncio.fixture
async def any_user_client(db_session: AsyncSession):
    """Any authenticated user — read-only access."""

    async def override_get_db():
        yield db_session

    def override_get_current_user():
        return UserSession(
            email="employee@test.com",
            role="Employee",
            department_id=None,
            firebase_uid="uid-e",
            name="Employee Test",
        )

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    del app.dependency_overrides[get_db]
    del app.dependency_overrides[get_current_user]


@pytest_asyncio.fixture
async def sales_manager_client(db_session: AsyncSession):
    """Sales department manager — write access.

    Overrides ``require_sales_manager_or_admin`` by reference so that
    FastAPI's ``dependency_overrides`` intercepts it correctly.
    """

    async def override_get_db():
        yield db_session

    def override_require_sales_manager_or_admin():
        return UserSession(
            email="manager@sales.test",
            role="Manager",
            department_id=1,
            firebase_uid="uid-m",
            name="Sales Manager",
        )

    def override_get_current_user():
        return UserSession(
            email="manager@sales.test",
            role="Manager",
            department_id=1,
            firebase_uid="uid-m",
            name="Sales Manager",
        )

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[require_sales_manager_or_admin] = (
        override_require_sales_manager_or_admin
    )

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    del app.dependency_overrides[get_db]
    del app.dependency_overrides[get_current_user]
    del app.dependency_overrides[require_sales_manager_or_admin]


@pytest_asyncio.fixture
async def non_sales_client(db_session: AsyncSession):
    """Authenticated user without write permissions — expects 403 on writes.

    Does NOT override ``require_sales_manager_or_admin``, so the real
    security dependency runs and rejects the Employee role.
    """

    async def override_get_db():
        yield db_session

    def override_get_current_user():
        return UserSession(
            email="employee@test.com",
            role="Employee",
            department_id=None,
            firebase_uid="uid-e",
            name="Employee Test",
        )

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    del app.dependency_overrides[get_db]
    del app.dependency_overrides[get_current_user]

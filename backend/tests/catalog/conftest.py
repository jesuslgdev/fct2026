import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from composition.security import (
    get_current_user,
    require_admin,
    require_purchases_manager_or_admin,
)
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

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[require_admin] = override_require_admin
    app.dependency_overrides[get_current_user] = override_require_admin
    app.dependency_overrides[require_purchases_manager_or_admin] = (
        override_require_admin
    )

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    del app.dependency_overrides[get_db]
    del app.dependency_overrides[require_admin]
    del app.dependency_overrides[get_current_user]
    del app.dependency_overrides[require_purchases_manager_or_admin]


@pytest_asyncio.fixture
async def purchases_manager_client(db_session: AsyncSession):
    # Ensure Purchases department exists
    result = await db_session.execute(
        text(
            "INSERT INTO departments (name) VALUES ('Purchases') ON CONFLICT (name) DO UPDATE SET name = 'Purchases' RETURNING department_id"
        )
    )
    purchases_id = result.scalar_one()
    await db_session.flush()

    async def override_get_db():
        yield db_session

    def override_get_current_user():
        return UserSession(
            email="manager@test.com",
            role="Manager",
            department_id=purchases_id,
            firebase_uid="test-uid-pm",
            name="Purchases Manager Test",
        )

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    # We DON'T override require_purchases_manager_or_admin here
    # to let the real logic check the department_id against the DB.

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    del app.dependency_overrides[get_db]
    del app.dependency_overrides[get_current_user]


@pytest_asyncio.fixture
async def other_manager_client(db_session: AsyncSession):
    # Ensure Sales department exists
    result = await db_session.execute(
        text(
            "INSERT INTO departments (name) VALUES ('Sales') ON CONFLICT (name) DO UPDATE SET name = 'Sales' RETURNING department_id"
        )
    )
    sales_id = result.scalar_one()
    await db_session.flush()

    async def override_get_db():
        yield db_session

    def override_get_current_user():
        return UserSession(
            email="other@test.com",
            role="Manager",
            department_id=sales_id,
            firebase_uid="test-uid-other",
            name="Other Manager Test",
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
async def non_admin_client(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    def override_get_current_user():
        return UserSession(
            email="employee@test.com",
            role="Employee",
            department_id=None,
            firebase_uid="test-uid-2",
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

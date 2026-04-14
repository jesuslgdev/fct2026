from unittest.mock import AsyncMock, MagicMock

import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from composition.security import get_current_user
from main import app
from shared.domain.dtos.user_session import UserSession
from shared.infrastructure.database.connection import get_db


def _mock_user(role: str, department_id: int | None = None):
    def override():
        return UserSession(
            user_id=1,
            email="test@test.com",
            role=role,
            department_id=department_id,
            firebase_uid="test-uid",
            name="Test User",
            last_login_at=None,
        )

    return override


def _mock_db(dept_id: int | None):
    """Returns a get_db override whose session resolves a department query to dept_id."""

    async def override_get_db():
        session = MagicMock()
        result = MagicMock()
        result.scalar_one_or_none.return_value = dept_id
        session.execute = AsyncMock(return_value=result)
        yield session

    return override_get_db


@pytest_asyncio.fixture
async def admin_client():
    app.dependency_overrides[get_current_user] = _mock_user("Administrator")
    app.dependency_overrides[get_db] = _mock_db(None)
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    del app.dependency_overrides[get_current_user]
    del app.dependency_overrides[get_db]


@pytest_asyncio.fixture
async def purchases_manager_client():
    purchases_dept_id = 5
    app.dependency_overrides[get_current_user] = _mock_user(
        "Manager", purchases_dept_id
    )
    app.dependency_overrides[get_db] = _mock_db(purchases_dept_id)
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    del app.dependency_overrides[get_current_user]
    del app.dependency_overrides[get_db]


@pytest_asyncio.fixture
async def other_manager_client():
    app.dependency_overrides[get_current_user] = _mock_user("Manager", department_id=99)
    app.dependency_overrides[get_db] = _mock_db(5)  # Purchases dept is 5, user is in 99
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    del app.dependency_overrides[get_current_user]
    del app.dependency_overrides[get_db]


@pytest_asyncio.fixture
async def employee_client():
    app.dependency_overrides[get_current_user] = _mock_user("Employee")
    app.dependency_overrides[get_db] = _mock_db(None)
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    del app.dependency_overrides[get_current_user]
    del app.dependency_overrides[get_db]


async def test_admin_can_access_protected_endpoint(admin_client: AsyncClient):
    response = await admin_client.get("/api/v1/suppliers/template")
    assert response.status_code == 200


async def test_purchases_manager_can_access_protected_endpoint(
    purchases_manager_client: AsyncClient,
):
    response = await purchases_manager_client.get("/api/v1/suppliers/template")
    assert response.status_code == 200


async def test_other_manager_gets_forbidden(other_manager_client: AsyncClient):
    response = await other_manager_client.get("/api/v1/suppliers/template")
    assert response.status_code == 403


async def test_employee_gets_forbidden(employee_client: AsyncClient):
    response = await employee_client.get("/api/v1/suppliers/template")
    assert response.status_code == 403


async def test_unauthenticated_gets_unauthorized(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.get("/api/v1/suppliers/template")
    assert response.status_code == 401

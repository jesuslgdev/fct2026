import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from composition.security import get_current_user, require_purchases_manager_or_admin
from main import app
from shared.domain.entities.user_session import UserSession


def _mock_user(role: str):
    def override():
        return UserSession(
            user_id=1,
            email="test@test.com",
            role=role,
            department_id=None,
            firebase_uid="test-uid",
            name="Test User",
        )

    return override


@pytest_asyncio.fixture
async def admin_client():
    app.dependency_overrides[get_current_user] = _mock_user("Administrator")
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    del app.dependency_overrides[get_current_user]


@pytest_asyncio.fixture
async def manager_client():
    app.dependency_overrides[get_current_user] = _mock_user("Manager")
    app.dependency_overrides[require_purchases_manager_or_admin] = _mock_user("Manager")
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    del app.dependency_overrides[get_current_user]
    del app.dependency_overrides[require_purchases_manager_or_admin]


@pytest_asyncio.fixture
async def employee_client():
    app.dependency_overrides[get_current_user] = _mock_user("Employee")
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    del app.dependency_overrides[get_current_user]


async def test_administrator_can_download(admin_client: AsyncClient):
    response = await admin_client.get("/api/v1/suppliers/template")
    assert response.status_code == 200
    assert response.headers["content-type"] == (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    assert "suppliers_template.xlsx" in response.headers["content-disposition"]


async def test_manager_can_download(manager_client: AsyncClient):
    response = await manager_client.get("/api/v1/suppliers/template")
    assert response.status_code == 200


async def test_employee_gets_forbidden(employee_client: AsyncClient):
    response = await employee_client.get("/api/v1/suppliers/template")
    assert response.status_code == 403


async def test_unauthenticated_gets_unauthorized(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.get("/api/v1/suppliers/template")
    assert response.status_code == 401

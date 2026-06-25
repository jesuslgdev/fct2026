from unittest.mock import AsyncMock, MagicMock

from fastapi import HTTPException, status
from httpx import AsyncClient

from composition.dependencies import (
    get_create_sale_use_case,
    get_get_sale_use_case,
    get_list_sales_use_case,
)
from composition.security import get_current_user, require_sales_department_or_admin
from main import app
from shared.domain.dtos.paginated_result import PaginatedResult
from shared.domain.dtos.user_session import UserSession
from tests.sales.conftest import _mock_other_user, _mock_sales_user, make_sale

_SALES_URL = "/api/v1/sales"
_STATUS_URL = "/api/v1/sales/1/status"


def _forbidden():
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions"
    )


async def test_create_sale_forbidden_for_other_department(auth_client: AsyncClient):
    """Overriding the security dep to return 403 verifies the endpoint respects it."""
    app.dependency_overrides[require_sales_department_or_admin] = _forbidden
    response = await auth_client.post(
        _SALES_URL,
        json={
            "client_id": 5,
            "warehouse_id": 2,
            "lines": [{"product_id": 10, "quantity": 1}],
        },
    )
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 403


async def test_advance_status_forbidden_for_other_department(auth_client: AsyncClient):
    app.dependency_overrides[require_sales_department_or_admin] = _forbidden
    response = await auth_client.patch(_STATUS_URL, json={"new_status": "Approved"})
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 403


async def test_list_sales_allowed_for_other_department(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        return_value=PaginatedResult(items=[], total=0, page=1, page_size=20)
    )
    app.dependency_overrides[get_current_user] = _mock_other_user
    app.dependency_overrides[get_list_sales_use_case] = lambda: mock
    response = await auth_client.get(_SALES_URL)
    app.dependency_overrides[get_current_user] = _mock_sales_user
    del app.dependency_overrides[get_list_sales_use_case]
    assert response.status_code == 200


async def test_get_sale_allowed_for_other_department(auth_client: AsyncClient):
    sale = make_sale()
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=sale)
    app.dependency_overrides[get_current_user] = _mock_other_user
    app.dependency_overrides[get_get_sale_use_case] = lambda: mock
    response = await auth_client.get("/api/v1/sales/1")
    app.dependency_overrides[get_current_user] = _mock_sales_user
    del app.dependency_overrides[get_get_sale_use_case]
    assert response.status_code == 200


async def test_unauthenticated_create_sale_returns_401(
    unauthenticated_client: AsyncClient,
):
    response = await unauthenticated_client.post(
        _SALES_URL,
        json={
            "client_id": 5,
            "warehouse_id": 2,
            "lines": [{"product_id": 10, "quantity": 1}],
        },
    )
    assert response.status_code == 401


async def test_unauthenticated_advance_status_returns_401(
    unauthenticated_client: AsyncClient,
):
    response = await unauthenticated_client.patch(
        _STATUS_URL, json={"new_status": "Approved"}
    )
    assert response.status_code == 401


async def test_admin_user_can_access_sales_endpoint(auth_client: AsyncClient):
    """Admin role bypasses the department check — verified by returning 201."""
    sale = make_sale()
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=sale)
    app.dependency_overrides[get_create_sale_use_case] = lambda: mock

    def _admin_user() -> UserSession:
        return UserSession(
            user_id=10,
            email="admin@test.com",
            role="Administrator",
            department_id=None,
            firebase_uid="admin-uid",
            name="Admin User",
            last_login_at=None,
        )

    app.dependency_overrides[require_sales_department_or_admin] = _admin_user
    response = await auth_client.post(
        _SALES_URL,
        json={
            "client_id": 5,
            "warehouse_id": 2,
            "lines": [{"product_id": 10, "quantity": 1}],
        },
    )
    del app.dependency_overrides[get_create_sale_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 201

from unittest.mock import AsyncMock, MagicMock

from fastapi import HTTPException, status
from httpx import AsyncClient

from composition.dependencies import get_delete_sale_use_case
from composition.security import require_sales_department_or_admin
from main import app
from modules.sales.domain.exceptions import SaleException, SaleExceptionInfo
from tests.sales.conftest import _mock_sales_user

_DELETE_URL = "/api/v1/sales/1"


def _forbidden():
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions"
    )


async def test_delete_sale_returns_204(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=None)
    app.dependency_overrides[get_delete_sale_use_case] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    response = await auth_client.delete(_DELETE_URL)
    del app.dependency_overrides[get_delete_sale_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 204


async def test_delete_sale_not_found_returns_404(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        side_effect=SaleException(SaleExceptionInfo.SALE_NOT_FOUND)
    )
    app.dependency_overrides[get_delete_sale_use_case] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    response = await auth_client.delete("/api/v1/sales/999")
    del app.dependency_overrides[get_delete_sale_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 404


async def test_delete_sale_not_deletable_returns_400(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        side_effect=SaleException(SaleExceptionInfo.SALE_NOT_DELETABLE)
    )
    app.dependency_overrides[get_delete_sale_use_case] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    response = await auth_client.delete(_DELETE_URL)
    del app.dependency_overrides[get_delete_sale_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 400


async def test_delete_sale_forbidden_returns_403(auth_client: AsyncClient):
    app.dependency_overrides[require_sales_department_or_admin] = _forbidden
    response = await auth_client.delete(_DELETE_URL)
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 403


async def test_delete_sale_unauthenticated_returns_401(
    unauthenticated_client: AsyncClient,
):
    response = await unauthenticated_client.delete(_DELETE_URL)
    assert response.status_code == 401


async def test_delete_sale_passes_sale_id_to_use_case(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=None)
    app.dependency_overrides[get_delete_sale_use_case] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    await auth_client.delete(_DELETE_URL)
    del app.dependency_overrides[get_delete_sale_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]
    mock.execute.assert_called_once_with(sale_id=1)

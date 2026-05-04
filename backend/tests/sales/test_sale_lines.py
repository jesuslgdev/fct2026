from unittest.mock import AsyncMock, MagicMock

from httpx import AsyncClient

from composition.dependencies import (
    get_add_sale_line_use_case,
    get_remove_sale_line_use_case,
    get_update_sale_line_use_case,
)
from composition.security import require_sales_department_or_admin
from main import app
from modules.sales.domain.exceptions import SaleException, SaleExceptionInfo
from tests.sales.conftest import _mock_sales_user, make_sale


def _override(dep_key, return_value=None, side_effect=None):
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=return_value, side_effect=side_effect)
    app.dependency_overrides[dep_key] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    return mock


def _cleanup(*dep_keys):
    for key in dep_keys:
        app.dependency_overrides.pop(key, None)
    app.dependency_overrides.pop(require_sales_department_or_admin, None)


# --- POST /{sale_id}/lines ---


async def test_add_sale_line_returns_201(auth_client: AsyncClient):
    sale = make_sale()
    _override(get_add_sale_line_use_case, return_value=sale)
    response = await auth_client.post(
        "/api/v1/sales/1/lines",
        json={"product_id": 10, "quantity": 3},
    )
    _cleanup(get_add_sale_line_use_case)
    assert response.status_code == 201
    assert response.json()["sale_id"] == 1


async def test_add_sale_line_sale_not_found_returns_404(auth_client: AsyncClient):
    _override(
        get_add_sale_line_use_case,
        side_effect=SaleException(SaleExceptionInfo.SALE_NOT_FOUND),
    )
    response = await auth_client.post(
        "/api/v1/sales/999/lines",
        json={"product_id": 10, "quantity": 1},
    )
    _cleanup(get_add_sale_line_use_case)
    assert response.status_code == 404


async def test_add_sale_line_sale_not_pending_returns_400(auth_client: AsyncClient):
    _override(
        get_add_sale_line_use_case,
        side_effect=SaleException(SaleExceptionInfo.SALE_NOT_PENDING),
    )
    response = await auth_client.post(
        "/api/v1/sales/1/lines",
        json={"product_id": 10, "quantity": 1},
    )
    _cleanup(get_add_sale_line_use_case)
    assert response.status_code == 400


async def test_add_sale_line_insufficient_stock_returns_400(auth_client: AsyncClient):
    _override(
        get_add_sale_line_use_case,
        side_effect=SaleException(SaleExceptionInfo.INSUFFICIENT_STOCK),
    )
    response = await auth_client.post(
        "/api/v1/sales/1/lines",
        json={"product_id": 10, "quantity": 9999},
    )
    _cleanup(get_add_sale_line_use_case)
    assert response.status_code == 422


async def test_add_sale_line_percent_discount_100_rejected(auth_client: AsyncClient):
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    response = await auth_client.post(
        "/api/v1/sales/1/lines",
        json={
            "product_id": 10,
            "quantity": 1,
            "discount": 100,
            "discount_type": "percent",
        },
    )
    app.dependency_overrides.pop(require_sales_department_or_admin, None)
    assert response.status_code == 422


async def test_add_sale_line_amount_discount_accepted(auth_client: AsyncClient):
    sale = make_sale()
    mock = _override(get_add_sale_line_use_case, return_value=sale)
    response = await auth_client.post(
        "/api/v1/sales/1/lines",
        json={
            "product_id": 10,
            "quantity": 2,
            "discount": "5.00",
            "discount_type": "amount",
        },
    )
    _cleanup(get_add_sale_line_use_case)
    assert response.status_code == 201
    assert mock.execute.call_args.kwargs["discount_type"] == "amount"


# --- PUT /{sale_id}/lines/{sale_line_id} ---


async def test_update_sale_line_success(auth_client: AsyncClient):
    sale = make_sale()
    _override(get_update_sale_line_use_case, return_value=sale)
    response = await auth_client.put(
        "/api/v1/sales/1/lines/1",
        json={"quantity": 5},
    )
    _cleanup(get_update_sale_line_use_case)
    assert response.status_code == 200
    assert response.json()["sale_id"] == 1


async def test_update_sale_line_not_found_returns_404(auth_client: AsyncClient):
    _override(
        get_update_sale_line_use_case,
        side_effect=SaleException(SaleExceptionInfo.SALE_LINE_NOT_FOUND),
    )
    response = await auth_client.put(
        "/api/v1/sales/1/lines/999",
        json={"quantity": 1},
    )
    _cleanup(get_update_sale_line_use_case)
    assert response.status_code == 404


async def test_update_sale_line_passes_discount_type(auth_client: AsyncClient):
    sale = make_sale()
    mock = _override(get_update_sale_line_use_case, return_value=sale)
    response = await auth_client.put(
        "/api/v1/sales/1/lines/1",
        json={"quantity": 2, "discount": "10.00", "discount_type": "amount"},
    )
    _cleanup(get_update_sale_line_use_case)
    assert response.status_code == 200
    assert mock.execute.call_args.kwargs["discount_type"] == "amount"


# --- DELETE /{sale_id}/lines/{sale_line_id} ---


async def test_remove_sale_line_success(auth_client: AsyncClient):
    sale = make_sale()
    _override(get_remove_sale_line_use_case, return_value=sale)
    response = await auth_client.delete("/api/v1/sales/1/lines/1")
    _cleanup(get_remove_sale_line_use_case)
    assert response.status_code == 200
    assert response.json()["sale_id"] == 1


async def test_remove_sale_line_minimum_one_line_returns_422(auth_client: AsyncClient):
    _override(
        get_remove_sale_line_use_case,
        side_effect=SaleException(SaleExceptionInfo.MINIMUM_ONE_LINE),
    )
    response = await auth_client.delete("/api/v1/sales/1/lines/1")
    _cleanup(get_remove_sale_line_use_case)
    assert response.status_code == 422


async def test_remove_sale_line_not_pending_returns_400(auth_client: AsyncClient):
    _override(
        get_remove_sale_line_use_case,
        side_effect=SaleException(SaleExceptionInfo.SALE_NOT_PENDING),
    )
    response = await auth_client.delete("/api/v1/sales/1/lines/1")
    _cleanup(get_remove_sale_line_use_case)
    assert response.status_code == 400

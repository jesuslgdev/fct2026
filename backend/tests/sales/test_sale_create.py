from unittest.mock import AsyncMock, MagicMock

from httpx import AsyncClient

from composition.dependencies import get_create_sale_use_case
from composition.security import require_sales_department_or_admin
from main import app
from modules.sales.domain.exceptions import (
    InsufficientStockForLineError,
    SaleException,
    SaleExceptionInfo,
)
from tests.sales.conftest import _mock_sales_user, make_sale

_CREATE_URL = "/api/v1/sales"
_VALID_BODY = {
    "client_id": 5,
    "warehouse_id": 2,
    "lines": [{"product_id": 10, "quantity": 2}],
}


async def test_create_sale_returns_201(auth_client: AsyncClient):
    sale = make_sale(status="Pending")
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=sale)
    app.dependency_overrides[get_create_sale_use_case] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    response = await auth_client.post(_CREATE_URL, json=_VALID_BODY)
    del app.dependency_overrides[get_create_sale_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 201
    data = response.json()
    assert data["sale_id"] == 1
    assert data["status"] == "Pending"
    assert data["warehouse_id"] == 2


async def test_create_sale_allowed_transitions_contain_approved_and_cancelled(
    auth_client: AsyncClient,
):
    sale = make_sale(status="Pending")
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=sale)
    app.dependency_overrides[get_create_sale_use_case] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    response = await auth_client.post(_CREATE_URL, json=_VALID_BODY)
    del app.dependency_overrides[get_create_sale_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 201
    transitions = response.json()["allowed_transitions"]
    assert set(transitions) == {"Approved", "Cancelled"}


async def test_create_sale_client_not_found_returns_404(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        side_effect=SaleException(SaleExceptionInfo.CLIENT_NOT_FOUND)
    )
    app.dependency_overrides[get_create_sale_use_case] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    response = await auth_client.post(_CREATE_URL, json=_VALID_BODY)
    del app.dependency_overrides[get_create_sale_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 404


async def test_create_sale_warehouse_not_found_returns_404(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        side_effect=SaleException(SaleExceptionInfo.WAREHOUSE_NOT_FOUND)
    )
    app.dependency_overrides[get_create_sale_use_case] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    response = await auth_client.post(_CREATE_URL, json=_VALID_BODY)
    del app.dependency_overrides[get_create_sale_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 404


async def test_create_sale_missing_lines_returns_422(auth_client: AsyncClient):
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    response = await auth_client.post(
        _CREATE_URL, json={"client_id": 5, "warehouse_id": 2, "lines": []}
    )
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 422


async def test_create_sale_passes_warehouse_id_to_use_case(auth_client: AsyncClient):
    sale = make_sale()
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=sale)
    app.dependency_overrides[get_create_sale_use_case] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    await auth_client.post(_CREATE_URL, json=_VALID_BODY)
    del app.dependency_overrides[get_create_sale_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]
    call_kwargs = mock.execute.call_args.kwargs
    assert call_kwargs["warehouse_id"] == 2
    assert call_kwargs["client_id"] == 5


async def test_create_sale_insufficient_stock_returns_field_error(
    auth_client: AsyncClient,
):
    mock = MagicMock()
    mock.execute = AsyncMock(side_effect=InsufficientStockForLineError(0))
    app.dependency_overrides[get_create_sale_use_case] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    response = await auth_client.post(_CREATE_URL, json=_VALID_BODY)
    del app.dependency_overrides[get_create_sale_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert isinstance(detail, list)
    assert detail[0]["loc"] == ["body", "lines", 0, "quantity"]
    assert "stock" in detail[0]["msg"].lower()


async def test_create_sale_percent_discount_100_rejected(auth_client: AsyncClient):
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    body = {
        "client_id": 5,
        "warehouse_id": 2,
        "lines": [
            {
                "product_id": 10,
                "quantity": 2,
                "discount": 100,
                "discount_type": "percent",
            }
        ],
    }
    response = await auth_client.post(_CREATE_URL, json=body)
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 422


async def test_create_sale_amount_discount_accepted(auth_client: AsyncClient):
    sale = make_sale()
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=sale)
    app.dependency_overrides[get_create_sale_use_case] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    body = {
        "client_id": 5,
        "warehouse_id": 2,
        "lines": [
            {
                "product_id": 10,
                "quantity": 2,
                "discount": "5.00",
                "discount_type": "amount",
            }
        ],
    }
    response = await auth_client.post(_CREATE_URL, json=body)
    del app.dependency_overrides[get_create_sale_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 201
    call_kwargs = mock.execute.call_args.kwargs
    assert call_kwargs["lines"][0]["discount_type"] == "amount"

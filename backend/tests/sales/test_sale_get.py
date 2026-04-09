from unittest.mock import AsyncMock, MagicMock

from httpx import AsyncClient

from composition.dependencies import get_get_sale_use_case
from main import app
from modules.sales.domain.exceptions import SaleException, SaleExceptionInfo
from tests.sales.conftest import make_sale, make_sale_line


async def test_get_sale_success(auth_client: AsyncClient):
    sale = make_sale()
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=sale)
    app.dependency_overrides[get_get_sale_use_case] = lambda: mock
    response = await auth_client.get("/api/v1/sales/1")
    del app.dependency_overrides[get_get_sale_use_case]
    assert response.status_code == 200
    body = response.json()
    assert body["sale_id"] == 1
    assert body["sale_number"] == "VEN-2026-0001"
    assert body["status"] == "Pending"
    assert body["client_id"] == 5
    assert body["user_id"] == 1
    assert body["created_by_name"] == "Sales Employee"
    assert len(body["lines"]) == 1


async def test_get_sale_delivery_address(auth_client: AsyncClient):
    sale = make_sale(delivery_address="Gran Via 10, Barcelona, Cataluña, 08001")
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=sale)
    app.dependency_overrides[get_get_sale_use_case] = lambda: mock
    response = await auth_client.get("/api/v1/sales/1")
    del app.dependency_overrides[get_get_sale_use_case]
    assert response.status_code == 200
    assert (
        response.json()["delivery_address"] == "Gran Via 10, Barcelona, Cataluña, 08001"
    )


async def test_get_sale_economic_summary(auth_client: AsyncClient):
    sale = make_sale()
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=sale)
    app.dependency_overrides[get_get_sale_use_case] = lambda: mock
    response = await auth_client.get("/api/v1/sales/1")
    del app.dependency_overrides[get_get_sale_use_case]
    assert response.status_code == 200
    body = response.json()
    assert float(body["subtotal"]) == 100.00
    assert float(body["taxes"]) == 21.00
    assert float(body["total"]) == 121.00


async def test_get_sale_line_details(auth_client: AsyncClient):
    from decimal import Decimal

    line = make_sale_line(
        quantity=3,
        unit_price=Decimal("30.00"),
        line_subtotal=Decimal("90.00"),
        vat_rate=Decimal("0.10"),
        line_tax=Decimal("9.00"),
    )
    sale = make_sale(lines=[line])
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=sale)
    app.dependency_overrides[get_get_sale_use_case] = lambda: mock
    response = await auth_client.get("/api/v1/sales/1")
    del app.dependency_overrides[get_get_sale_use_case]
    assert response.status_code == 200
    line_body = response.json()["lines"][0]
    assert line_body["quantity"] == 3
    assert float(line_body["unit_price"]) == 30.00
    assert float(line_body["line_subtotal"]) == 90.00
    assert float(line_body["vat_rate"]) == 0.10
    assert float(line_body["line_tax"]) == 9.00


async def test_get_sale_not_found(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        side_effect=SaleException(SaleExceptionInfo.SALE_NOT_FOUND)
    )
    app.dependency_overrides[get_get_sale_use_case] = lambda: mock
    response = await auth_client.get("/api/v1/sales/999")
    del app.dependency_overrides[get_get_sale_use_case]
    assert response.status_code == 404


async def test_get_sale_unauthenticated(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.get("/api/v1/sales/1")
    assert response.status_code == 401

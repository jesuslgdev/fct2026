from unittest.mock import AsyncMock, MagicMock

from httpx import AsyncClient

from composition.dependencies import get_get_purchase_use_case
from main import app
from modules.purchases.domain.exceptions import PurchaseException, PurchaseExceptionInfo
from tests.purchases.conftest import make_enriched, make_purchase, make_purchase_line


async def test_get_purchase_success(auth_client: AsyncClient):
    enriched = make_enriched()
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=enriched)
    app.dependency_overrides[get_get_purchase_use_case] = lambda: mock
    response = await auth_client.get("/api/v1/purchases/1")
    del app.dependency_overrides[get_get_purchase_use_case]
    assert response.status_code == 200
    body = response.json()
    assert body["purchase_id"] == 1
    assert body["purchase_number"] == "COM-2026-0001"
    assert body["status"] == "Pending"
    assert body["supplier_id"] == 5
    assert body["user_id"] == 3
    assert body["warehouse_id"] == 2
    assert len(body["lines"]) == 1


async def test_get_purchase_has_supplier_name(auth_client: AsyncClient):
    enriched = make_enriched()
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=enriched)
    app.dependency_overrides[get_get_purchase_use_case] = lambda: mock
    response = await auth_client.get("/api/v1/purchases/1")
    del app.dependency_overrides[get_get_purchase_use_case]
    assert response.status_code == 200
    assert response.json()["supplier_name"] == "Proveedor Test S.L."


async def test_get_purchase_has_user_name(auth_client: AsyncClient):
    enriched = make_enriched()
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=enriched)
    app.dependency_overrides[get_get_purchase_use_case] = lambda: mock
    response = await auth_client.get("/api/v1/purchases/1")
    del app.dependency_overrides[get_get_purchase_use_case]
    assert response.status_code == 200
    assert response.json()["user_name"] == "Juan García"


async def test_get_purchase_warehouse_name_is_none(auth_client: AsyncClient):
    enriched = make_enriched(warehouse_name=None)
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=enriched)
    app.dependency_overrides[get_get_purchase_use_case] = lambda: mock
    response = await auth_client.get("/api/v1/purchases/1")
    del app.dependency_overrides[get_get_purchase_use_case]
    assert response.status_code == 200
    assert response.json()["warehouse_name"] is None


async def test_get_purchase_lines_have_product_name(auth_client: AsyncClient):
    enriched = make_enriched()
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=enriched)
    app.dependency_overrides[get_get_purchase_use_case] = lambda: mock
    response = await auth_client.get("/api/v1/purchases/1")
    del app.dependency_overrides[get_get_purchase_use_case]
    assert response.status_code == 200
    line = response.json()["lines"][0]
    assert line["product_name"] == "Tornillo M8"
    assert line["product_id"] == 10


async def test_get_purchase_economic_summary(auth_client: AsyncClient):
    enriched = make_enriched()
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=enriched)
    app.dependency_overrides[get_get_purchase_use_case] = lambda: mock
    response = await auth_client.get("/api/v1/purchases/1")
    del app.dependency_overrides[get_get_purchase_use_case]
    assert response.status_code == 200
    body = response.json()
    assert float(body["subtotal"]) == 100.00
    assert float(body["taxes"]) == 21.00
    assert float(body["total"]) == 121.00


async def test_get_purchase_line_details(auth_client: AsyncClient):
    from decimal import Decimal

    line = make_purchase_line(
        quantity=3,
        unit_price=50,
        discount=10,
        line_subtotal=140,
        vat_rate=Decimal("0.21"),
        line_tax=Decimal("29.40"),
    )
    purchase = make_purchase(lines=[line])
    enriched = make_enriched(purchase=purchase, product_names={10: "Tornillo M8"})
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=enriched)
    app.dependency_overrides[get_get_purchase_use_case] = lambda: mock
    response = await auth_client.get("/api/v1/purchases/1")
    del app.dependency_overrides[get_get_purchase_use_case]
    assert response.status_code == 200
    line_body = response.json()["lines"][0]
    assert line_body["quantity"] == 3
    assert float(line_body["unit_price"]) == 50.00
    assert float(line_body["discount"]) == 10.00
    assert float(line_body["line_subtotal"]) == 140.00
    assert float(line_body["vat_rate"]) == 0.21
    assert float(line_body["line_tax"]) == 29.40


async def test_get_purchase_line_reduced_vat(auth_client: AsyncClient):
    from decimal import Decimal

    line = make_purchase_line(
        line_subtotal=Decimal("100.00"),
        vat_rate=Decimal("0.10"),
        line_tax=Decimal("10.00"),
    )
    purchase = make_purchase(
        lines=[line],
        subtotal=Decimal("100.00"),
        taxes=Decimal("10.00"),
        total=Decimal("110.00"),
    )
    enriched = make_enriched(purchase=purchase, product_names={10: "Pan"})
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=enriched)
    app.dependency_overrides[get_get_purchase_use_case] = lambda: mock
    response = await auth_client.get("/api/v1/purchases/1")
    del app.dependency_overrides[get_get_purchase_use_case]
    assert response.status_code == 200
    body = response.json()
    line_body = body["lines"][0]
    assert float(line_body["vat_rate"]) == 0.10
    assert float(line_body["line_tax"]) == 10.00
    assert float(body["taxes"]) == 10.00
    assert float(body["total"]) == 110.00


async def test_get_purchase_not_found(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        side_effect=PurchaseException(PurchaseExceptionInfo.PURCHASE_NOT_FOUND)
    )
    app.dependency_overrides[get_get_purchase_use_case] = lambda: mock
    response = await auth_client.get("/api/v1/purchases/999")
    del app.dependency_overrides[get_get_purchase_use_case]
    assert response.status_code == 404


async def test_get_purchase_unauthenticated(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.get("/api/v1/purchases/1")
    assert response.status_code == 401

from httpx import AsyncClient

from modules.catalog.domain.entities.product import Product
from modules.warehouse.domain.entities.warehouse_stock import WarehouseStock


async def test_stock_overview_multiple_warehouses(
    client: AsyncClient,
    sample_product: Product,
    stock_in_two_warehouses: list[WarehouseStock],
):
    """Global stock is the sum across warehouses with correct breakdown."""
    response = await client.get(
        f"/api/v1/warehouse/products/{sample_product.product_id}/stock"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["product_id"] == sample_product.product_id
    assert data["product_code"] == "PROD-001"
    assert data["product_name"] == "Smartphone"
    assert data["stock_global"] == 15  # 8 + 7
    assert data["stock_min"] == 10
    assert data["alert_level"] == "ok"
    assert len(data["warehouses"]) == 2


async def test_stock_overview_alert_ok(
    client: AsyncClient,
    sample_product: Product,
    stock_in_two_warehouses: list[WarehouseStock],
):
    """Alert level is 'ok' when global stock >= stock_min."""
    response = await client.get(
        f"/api/v1/warehouse/products/{sample_product.product_id}/stock"
    )

    assert response.status_code == 200
    assert response.json()["alert_level"] == "ok"


async def test_stock_overview_alert_critical(
    client: AsyncClient,
    sample_product: Product,
    stock_zero_in_warehouse: WarehouseStock,
):
    """Alert level is 'critical' when global stock is zero."""
    response = await client.get(
        f"/api/v1/warehouse/products/{sample_product.product_id}/stock"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["stock_global"] == 0
    assert data["alert_level"] == "critical"


async def test_stock_overview_alert_warning(
    client: AsyncClient,
    sample_product: Product,
    stock_below_min: WarehouseStock,
):
    """Alert level is 'warning' when 0 < global stock < stock_min."""
    response = await client.get(
        f"/api/v1/warehouse/products/{sample_product.product_id}/stock"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["stock_global"] == 5
    assert data["alert_level"] == "warning"


async def test_stock_overview_product_not_found(client: AsyncClient):
    """Returns 404 with error code 6201 for non-existent product."""
    response = await client.get("/api/v1/warehouse/products/9999/stock")

    assert response.status_code == 404
    assert response.json()["error_code"] == 6201


async def test_stock_overview_requires_auth(unauthenticated_client: AsyncClient):
    """Returns 401 when no authentication token is provided."""
    response = await unauthenticated_client.get("/api/v1/warehouse/products/1/stock")

    assert response.status_code == 401


async def test_stock_overview_available_stock(
    client: AsyncClient,
    sample_product: Product,
    stock_in_two_warehouses: list[WarehouseStock],
):
    """Available stock equals stock minus reserved_stock per warehouse."""
    response = await client.get(
        f"/api/v1/warehouse/products/{sample_product.product_id}/stock"
    )

    assert response.status_code == 200
    warehouses = response.json()["warehouses"]

    # Warehouse A: stock=8, reserved=2, available=6
    wh_a = next(w for w in warehouses if w["warehouse_name"] == "Warehouse A")
    assert wh_a["stock"] == 8
    assert wh_a["reserved_stock"] == 2
    assert wh_a["available_stock"] == 6

    # Warehouse B: stock=7, reserved=0, available=7
    wh_b = next(w for w in warehouses if w["warehouse_name"] == "Warehouse B")
    assert wh_b["stock"] == 7
    assert wh_b["reserved_stock"] == 0
    assert wh_b["available_stock"] == 7


async def test_stock_overview_no_stock_entries(
    client: AsyncClient,
    sample_product: Product,
):
    """Product with no warehouse stock entries returns stock_global=0 and critical."""
    response = await client.get(
        f"/api/v1/warehouse/products/{sample_product.product_id}/stock"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["stock_global"] == 0
    assert data["alert_level"] == "critical"
    assert data["warehouses"] == []

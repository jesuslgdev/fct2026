from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.catalog.domain.entities.product import Product
from modules.warehouse.domain.entities.stock_movement import StockMovement
from modules.warehouse.domain.entities.warehouse import Warehouse
from modules.warehouse.domain.entities.warehouse_stock import WarehouseStock

BASE = "/api/v1/warehouse/stock/adjust"


# ── Success cases ──────────────────────────────────────────────────


async def test_adjust_stock_success(
    client: AsyncClient,
    warehouse_a: Warehouse,
    sample_product: Product,
):
    """Successful adjustment returns correct movement data."""
    response = await client.post(
        BASE,
        json={
            "warehouse_id": warehouse_a.warehouse_id,
            "product_id": sample_product.product_id,
            "new_quantity": 50,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["warehouse_id"] == warehouse_a.warehouse_id
    assert data["product_id"] == sample_product.product_id
    assert data["previous_quantity"] == 0
    assert data["new_quantity"] == 50
    assert data["difference"] == 50
    assert data["global_stock"] == 50
    assert "movement_id" in data
    assert "created_at" in data


async def test_adjust_stock_creates_movement_record(
    client: AsyncClient,
    db_session: AsyncSession,
    warehouse_a: Warehouse,
    sample_product: Product,
):
    """A StockMovement row is persisted in the database after adjustment."""
    await client.post(
        BASE,
        json={
            "warehouse_id": warehouse_a.warehouse_id,
            "product_id": sample_product.product_id,
            "new_quantity": 30,
            "reason": "Initial stock load",
        },
    )

    result = await db_session.execute(
        select(StockMovement).where(
            StockMovement.warehouse_id == warehouse_a.warehouse_id,
            StockMovement.product_id == sample_product.product_id,
        )
    )
    movement = result.scalar_one_or_none()
    assert movement is not None
    assert movement.new_quantity == 30
    assert movement.previous_quantity == 0
    assert movement.difference == 30
    assert movement.reason == "Initial stock load"
    assert movement.movement_type == "adjustment"


async def test_adjust_stock_upserts_new_stock_record(
    client: AsyncClient,
    db_session: AsyncSession,
    warehouse_a: Warehouse,
    sample_product: Product,
):
    """When no WarehouseStock exists, a new record is created."""
    await client.post(
        BASE,
        json={
            "warehouse_id": warehouse_a.warehouse_id,
            "product_id": sample_product.product_id,
            "new_quantity": 15,
        },
    )

    result = await db_session.execute(
        select(WarehouseStock).where(
            WarehouseStock.warehouse_id == warehouse_a.warehouse_id,
            WarehouseStock.product_id == sample_product.product_id,
        )
    )
    stock = result.scalar_one_or_none()
    assert stock is not None
    assert stock.stock == 15


async def test_adjust_stock_updates_existing_stock(
    client: AsyncClient,
    db_session: AsyncSession,
    stock_in_two_warehouses: list[WarehouseStock],
    warehouse_a: Warehouse,
    sample_product: Product,
):
    """When a WarehouseStock row already exists, its stock is updated."""
    response = await client.post(
        BASE,
        json={
            "warehouse_id": warehouse_a.warehouse_id,
            "product_id": sample_product.product_id,
            "new_quantity": 99,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["previous_quantity"] == 8  # seeded by stock_in_two_warehouses
    assert data["new_quantity"] == 99
    assert data["difference"] == 91


async def test_adjust_stock_with_reason(
    client: AsyncClient,
    db_session: AsyncSession,
    warehouse_a: Warehouse,
    sample_product: Product,
):
    """Reason field is stored in the movement record when provided."""
    await client.post(
        BASE,
        json={
            "warehouse_id": warehouse_a.warehouse_id,
            "product_id": sample_product.product_id,
            "new_quantity": 10,
            "reason": "Quarterly stock count",
        },
    )

    result = await db_session.execute(
        select(StockMovement).where(
            StockMovement.warehouse_id == warehouse_a.warehouse_id,
        )
    )
    movement = result.scalar_one()
    assert movement.reason == "Quarterly stock count"


async def test_adjust_stock_without_reason(
    client: AsyncClient,
    warehouse_a: Warehouse,
    sample_product: Product,
):
    """Adjustment without a reason field is accepted."""
    response = await client.post(
        BASE,
        json={
            "warehouse_id": warehouse_a.warehouse_id,
            "product_id": sample_product.product_id,
            "new_quantity": 5,
        },
    )

    assert response.status_code == 200
    assert response.json()["new_quantity"] == 5


async def test_adjust_stock_zero_quantity(
    client: AsyncClient,
    warehouse_a: Warehouse,
    sample_product: Product,
):
    """Setting stock to zero is a valid adjustment."""
    response = await client.post(
        BASE,
        json={
            "warehouse_id": warehouse_a.warehouse_id,
            "product_id": sample_product.product_id,
            "new_quantity": 0,
        },
    )

    assert response.status_code == 200
    assert response.json()["new_quantity"] == 0
    assert response.json()["global_stock"] == 0


async def test_adjust_stock_updates_global_stock(
    client: AsyncClient,
    db_session: AsyncSession,
    stock_in_two_warehouses: list[WarehouseStock],
    warehouse_a: Warehouse,
    sample_product: Product,
):
    """Product.stock_current reflects the sum across all warehouses after adjustment."""
    # stock_in_two_warehouses seeds: warehouse_a=8, warehouse_b=7 → total=15
    response = await client.post(
        BASE,
        json={
            "warehouse_id": warehouse_a.warehouse_id,
            "product_id": sample_product.product_id,
            "new_quantity": 20,
        },
    )

    assert response.status_code == 200
    # warehouse_a=20, warehouse_b=7 → global=27
    assert response.json()["global_stock"] == 27

    await db_session.refresh(sample_product)
    assert sample_product.stock_current == 27


# ── Domain errors ──────────────────────────────────────────────────


async def test_adjust_stock_warehouse_not_found(
    client: AsyncClient,
    sample_product: Product,
):
    """Returns 404 with error code 6101 when warehouse does not exist."""
    response = await client.post(
        BASE,
        json={
            "warehouse_id": 9999,
            "product_id": sample_product.product_id,
            "new_quantity": 10,
        },
    )

    assert response.status_code == 404
    assert response.json()["error_code"] == 6101


async def test_adjust_stock_product_not_found(
    client: AsyncClient,
    warehouse_a: Warehouse,
):
    """Returns 404 with error code 6201 when product does not exist."""
    response = await client.post(
        BASE,
        json={
            "warehouse_id": warehouse_a.warehouse_id,
            "product_id": 9999,
            "new_quantity": 10,
        },
    )

    assert response.status_code == 404
    assert response.json()["error_code"] == 6201


async def test_adjust_stock_product_inactive(
    client: AsyncClient,
    warehouse_a: Warehouse,
    inactive_product: Product,
):
    """Returns 409 with error code 6204 when product is inactive."""
    response = await client.post(
        BASE,
        json={
            "warehouse_id": warehouse_a.warehouse_id,
            "product_id": inactive_product.product_id,
            "new_quantity": 10,
        },
    )

    assert response.status_code == 409
    assert response.json()["error_code"] == 6204


# ── Validation errors ──────────────────────────────────────────────


async def test_adjust_stock_negative_quantity(
    client: AsyncClient,
    warehouse_a: Warehouse,
    sample_product: Product,
):
    """Returns 422 when new_quantity is negative (Pydantic validation)."""
    response = await client.post(
        BASE,
        json={
            "warehouse_id": warehouse_a.warehouse_id,
            "product_id": sample_product.product_id,
            "new_quantity": -1,
        },
    )

    assert response.status_code == 422


async def test_adjust_stock_reason_too_long(
    client: AsyncClient,
    warehouse_a: Warehouse,
    sample_product: Product,
):
    """Returns 422 when reason exceeds 300 characters."""
    response = await client.post(
        BASE,
        json={
            "warehouse_id": warehouse_a.warehouse_id,
            "product_id": sample_product.product_id,
            "new_quantity": 10,
            "reason": "x" * 301,
        },
    )

    assert response.status_code == 422


# ── Auth ───────────────────────────────────────────────────────────


async def test_adjust_stock_requires_auth(
    unauthenticated_client: AsyncClient,
    warehouse_a: Warehouse,
    sample_product: Product,
):
    """Returns 401 when no authentication token is provided."""
    response = await unauthenticated_client.post(
        BASE,
        json={
            "warehouse_id": warehouse_a.warehouse_id,
            "product_id": sample_product.product_id,
            "new_quantity": 10,
        },
    )

    assert response.status_code == 401

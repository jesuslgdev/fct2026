from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.catalog.domain.entities.product import Product
from modules.warehouse.domain.entities.stock_movement import StockMovement
from modules.warehouse.domain.entities.warehouse import Warehouse
from modules.warehouse.domain.entities.warehouse_stock import WarehouseStock

BASE = "/api/v1/warehouse/warehouses"


def _address(street: str) -> dict:
    return {
        "street": street,
        "city": "Madrid",
        "province": "Madrid",
        "postal_code": "28001",
    }


# ── Create ────────────────────────────────────────────────────────


async def test_create_warehouse(admin_client: AsyncClient):
    """Successfully create a warehouse and receive 201."""
    response = await admin_client.post(
        BASE, json={"name": "New Warehouse", "address": _address("789 New St")}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Warehouse"
    assert data["address"]["street"] == "789 New St"
    assert data["address"]["city"] == "Madrid"
    assert data["total_stock"] == 0
    assert "warehouse_id" in data


async def test_create_warehouse_duplicate_name(
    admin_client: AsyncClient, sample_warehouse: Warehouse
):
    """Returns 409 with error code 6102 when name already exists."""
    response = await admin_client.post(
        BASE,
        json={"name": sample_warehouse.name, "address": _address("Other Address")},
    )

    assert response.status_code == 409
    assert response.json()["error_code"] == 6102


async def test_create_warehouse_missing_fields(admin_client: AsyncClient):
    """Returns 422 when required fields are missing."""
    response = await admin_client.post(BASE, json={})

    assert response.status_code == 422


async def test_create_warehouse_empty_name(admin_client: AsyncClient):
    """Returns 422 when name is empty string."""
    response = await admin_client.post(
        BASE, json={"name": "", "address": _address("Some Address")}
    )

    assert response.status_code == 422


# ── List ──────────────────────────────────────────────────────────


async def test_list_warehouses_empty(client: AsyncClient):
    """Returns empty list when no warehouses exist."""
    response = await client.get(BASE)

    assert response.status_code == 200
    assert response.json() == []


async def test_list_warehouses_with_data(
    client: AsyncClient,
    sample_warehouse: Warehouse,
    warehouse_with_stock: Warehouse,
    sample_product: Product,
):
    """Returns warehouses with their total stock."""
    response = await client.get(BASE)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

    by_name = {w["name"]: w for w in data}

    assert by_name["Main Warehouse"]["total_stock"] == 0
    assert by_name["Stocked Warehouse"]["total_stock"] == 10


# ── Get ───────────────────────────────────────────────────────────


async def test_get_warehouse(client: AsyncClient, sample_warehouse: Warehouse):
    """Returns a single warehouse with total stock."""
    response = await client.get(f"{BASE}/{sample_warehouse.warehouse_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Main Warehouse"
    assert data["address"]["street"] == "123 Main St"
    assert data["total_stock"] == 0


async def test_get_warehouse_with_stock(
    client: AsyncClient,
    warehouse_with_stock: Warehouse,
    sample_product: Product,
):
    """Returns warehouse with correct total stock from warehouse_stock rows."""
    response = await client.get(f"{BASE}/{warehouse_with_stock.warehouse_id}")

    assert response.status_code == 200
    assert response.json()["total_stock"] == 10


async def test_get_warehouse_not_found(client: AsyncClient):
    """Returns 404 with error code 6101 for non-existent warehouse."""
    response = await client.get(f"{BASE}/9999")

    assert response.status_code == 404
    assert response.json()["error_code"] == 6101


# ── Update ────────────────────────────────────────────────────────


async def test_update_warehouse(admin_client: AsyncClient, sample_warehouse: Warehouse):
    """Successfully update warehouse name and address."""
    response = await admin_client.put(
        f"{BASE}/{sample_warehouse.warehouse_id}",
        json={"name": "Updated Name", "address": _address("Updated Address")},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["address"]["street"] == "Updated Address"


async def test_update_warehouse_duplicate_name(
    admin_client: AsyncClient,
    sample_warehouse: Warehouse,
    warehouse_with_stock: Warehouse,
    sample_product: Product,
):
    """Returns 409 when updating to a name that already exists."""
    response = await admin_client.put(
        f"{BASE}/{sample_warehouse.warehouse_id}",
        json={"name": warehouse_with_stock.name, "address": _address("Any Address")},
    )

    assert response.status_code == 409
    assert response.json()["error_code"] == 6102


async def test_update_warehouse_same_name(
    admin_client: AsyncClient, sample_warehouse: Warehouse
):
    """Updating a warehouse keeping its own name succeeds."""
    response = await admin_client.put(
        f"{BASE}/{sample_warehouse.warehouse_id}",
        json={"name": sample_warehouse.name, "address": _address("New Address")},
    )

    assert response.status_code == 200
    assert response.json()["address"]["street"] == "New Address"


async def test_update_warehouse_not_found(admin_client: AsyncClient):
    """Returns 404 when updating a non-existent warehouse."""
    response = await admin_client.put(
        f"{BASE}/9999",
        json={"name": "Ghost", "address": _address("Nowhere")},
    )

    assert response.status_code == 404
    assert response.json()["error_code"] == 6101


# ── Delete ────────────────────────────────────────────────────────


async def test_delete_warehouse(admin_client: AsyncClient, sample_warehouse: Warehouse):
    """Successfully delete a warehouse with no stock."""
    response = await admin_client.delete(f"{BASE}/{sample_warehouse.warehouse_id}")

    assert response.status_code == 204

    # Confirm it's gone
    get_response = await admin_client.get(f"{BASE}/{sample_warehouse.warehouse_id}")
    assert get_response.status_code == 404


async def test_delete_warehouse_has_stock(
    admin_client: AsyncClient,
    warehouse_with_stock: Warehouse,
    sample_product: Product,
):
    """Returns 409 with error code 6103 when warehouse has stock."""
    response = await admin_client.delete(f"{BASE}/{warehouse_with_stock.warehouse_id}")

    assert response.status_code == 409
    assert response.json()["error_code"] == 6103


async def test_delete_warehouse_with_zero_stock_record(
    admin_client: AsyncClient,
    db_session: AsyncSession,
    sample_warehouse: Warehouse,
    sample_product: Product,
):
    """Returns 409 when a warehouse_stock row exists even if stock=0."""
    db_session.add(
        WarehouseStock(
            warehouse_id=sample_warehouse.warehouse_id,
            product_id=sample_product.product_id,
            stock=0,
            reserved_stock=0,
        )
    )
    await db_session.flush()

    response = await admin_client.delete(f"{BASE}/{sample_warehouse.warehouse_id}")

    assert response.status_code == 409
    assert response.json()["error_code"] == 6103


async def test_delete_warehouse_with_movement_history(
    admin_client: AsyncClient,
    db_session: AsyncSession,
    sample_warehouse: Warehouse,
    sample_product: Product,
):
    """Returns 409 when a stock_movement exists for the warehouse."""
    db_session.add(
        StockMovement(
            warehouse_id=sample_warehouse.warehouse_id,
            product_id=sample_product.product_id,
            movement_type="adjustment",
            previous_quantity=5,
            new_quantity=0,
            difference=-5,
            reason="cleared",
            user_email="admin@test.com",
        )
    )
    await db_session.flush()

    response = await admin_client.delete(f"{BASE}/{sample_warehouse.warehouse_id}")

    assert response.status_code == 409
    assert response.json()["error_code"] == 6103


async def test_delete_warehouse_not_found(admin_client: AsyncClient):
    """Returns 404 when deleting a non-existent warehouse."""
    response = await admin_client.delete(f"{BASE}/9999")

    assert response.status_code == 404
    assert response.json()["error_code"] == 6101


# ── Auth ──────────────────────────────────────────────────────────


async def test_list_warehouses_requires_auth(
    unauthenticated_client: AsyncClient,
):
    """Returns 401 when no authentication token is provided."""
    response = await unauthenticated_client.get(BASE)

    assert response.status_code == 401


async def test_create_warehouse_requires_auth(
    unauthenticated_client: AsyncClient,
):
    """Returns 401 for unauthenticated create attempt."""
    response = await unauthenticated_client.post(
        BASE, json={"name": "Test", "address": _address("Test")}
    )

    assert response.status_code == 401

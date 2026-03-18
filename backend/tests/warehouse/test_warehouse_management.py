from httpx import AsyncClient

from modules.catalog.domain.entities.product import Product
from modules.warehouse.domain.entities.warehouse import Warehouse

BASE = "/api/v1/warehouse/warehouses"


# ── Create ────────────────────────────────────────────────────────


async def test_create_warehouse(admin_client: AsyncClient):
    """Successfully create a warehouse and receive 201."""
    response = await admin_client.post(
        BASE, json={"name": "New Warehouse", "address": "789 New St"}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Warehouse"
    assert data["address"] == "789 New St"
    assert data["total_stock"] == 0
    assert "warehouse_id" in data


async def test_create_warehouse_duplicate_name(
    admin_client: AsyncClient, sample_warehouse: Warehouse
):
    """Returns 409 with error code 6102 when name already exists."""
    response = await admin_client.post(
        BASE, json={"name": sample_warehouse.name, "address": "Other Address"}
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
        BASE, json={"name": "", "address": "Some Address"}
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
    assert data["address"] == "123 Main St"
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
        json={"name": "Updated Name", "address": "Updated Address"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["address"] == "Updated Address"


async def test_update_warehouse_duplicate_name(
    admin_client: AsyncClient,
    sample_warehouse: Warehouse,
    warehouse_with_stock: Warehouse,
    sample_product: Product,
):
    """Returns 409 when updating to a name that already exists."""
    response = await admin_client.put(
        f"{BASE}/{sample_warehouse.warehouse_id}",
        json={"name": warehouse_with_stock.name, "address": "Any Address"},
    )

    assert response.status_code == 409
    assert response.json()["error_code"] == 6102


async def test_update_warehouse_same_name(
    admin_client: AsyncClient, sample_warehouse: Warehouse
):
    """Updating a warehouse keeping its own name succeeds."""
    response = await admin_client.put(
        f"{BASE}/{sample_warehouse.warehouse_id}",
        json={"name": sample_warehouse.name, "address": "New Address"},
    )

    assert response.status_code == 200
    assert response.json()["address"] == "New Address"


async def test_update_warehouse_not_found(admin_client: AsyncClient):
    """Returns 404 when updating a non-existent warehouse."""
    response = await admin_client.put(
        f"{BASE}/9999",
        json={"name": "Ghost", "address": "Nowhere"},
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
        BASE, json={"name": "Test", "address": "Test"}
    )

    assert response.status_code == 401

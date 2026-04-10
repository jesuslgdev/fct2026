from httpx import AsyncClient

from modules.warehouse.domain.entities.warehouse import Warehouse
from modules.warehouse.domain.entities.warehouse_stock import WarehouseStock

BASE = "/api/v1/warehouse/stock"


# ── Empty state ────────────────────────────────────────────────────


async def test_list_distribution_empty(client: AsyncClient):
    """Returns empty items list with total=0 when no stock records exist."""
    response = await client.get(BASE)

    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["page"] == 1


# ── With data ──────────────────────────────────────────────────────


async def test_list_distribution_with_data(
    client: AsyncClient,
    stock_distribution_seed: list[WarehouseStock],
    sample_product,
    second_product,
    warehouse_a: Warehouse,
    warehouse_b: Warehouse,
):
    """Returns all stock records with correct fields when data exists."""
    response = await client.get(BASE)

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    assert len(data["items"]) == 3

    # Verify required fields are present on each item
    for item in data["items"]:
        assert "warehouse_id" in item
        assert "warehouse_name" in item
        assert "product_id" in item
        assert "product_code" in item
        assert "product_name" in item
        assert "stock" in item
        assert "reserved_stock" in item
        assert "available_stock" in item


async def test_list_distribution_available_stock_computed(
    client: AsyncClient,
    stock_distribution_seed: list[WarehouseStock],
):
    """available_stock equals stock minus reserved_stock."""
    response = await client.get(BASE)

    assert response.status_code == 200
    for item in response.json()["items"]:
        assert item["available_stock"] == item["stock"] - item["reserved_stock"]


# ── Filtering ──────────────────────────────────────────────────────


async def test_filter_by_warehouse(
    client: AsyncClient,
    stock_distribution_seed: list[WarehouseStock],
    warehouse_b: Warehouse,
):
    """Filtering by warehouse_id returns only that warehouse's records."""
    response = await client.get(BASE, params={"warehouse_id": warehouse_b.warehouse_id})

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["warehouse_id"] == warehouse_b.warehouse_id


async def test_filter_by_product(
    client: AsyncClient,
    stock_distribution_seed: list[WarehouseStock],
    sample_product,
):
    """Filtering by product_id returns only that product's records."""
    response = await client.get(BASE, params={"product_id": sample_product.product_id})

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert all(
        item["product_id"] == sample_product.product_id for item in data["items"]
    )


async def test_filter_by_warehouse_and_product(
    client: AsyncClient,
    stock_distribution_seed: list[WarehouseStock],
    warehouse_a: Warehouse,
    second_product,
):
    """Combined warehouse + product filter returns exactly one record."""
    response = await client.get(
        BASE,
        params={
            "warehouse_id": warehouse_a.warehouse_id,
            "product_id": second_product.product_id,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["warehouse_id"] == warehouse_a.warehouse_id
    assert data["items"][0]["product_id"] == second_product.product_id


async def test_filter_by_search_partial_match(
    client: AsyncClient,
    stock_distribution_seed: list[WarehouseStock],
    sample_product: Product,
):
    """search filter returns only records whose product name contains the term."""
    response = await client.get(BASE, params={"search": "smart"})

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert all(
        item["product_id"] == sample_product.product_id for item in data["items"]
    )


async def test_filter_by_search_case_insensitive(
    client: AsyncClient,
    stock_distribution_seed: list[WarehouseStock],
    sample_product: Product,
):
    """search filter is case-insensitive."""
    response = await client.get(BASE, params={"search": "SMART"})

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert all(
        item["product_id"] == sample_product.product_id for item in data["items"]
    )


async def test_filter_by_search_no_match(
    client: AsyncClient,
    stock_distribution_seed: list[WarehouseStock],
):
    """search filter returns empty when no product name matches."""
    response = await client.get(BASE, params={"search": "nonexistent"})

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["items"] == []


async def test_filter_by_search_and_warehouse(
    client: AsyncClient,
    stock_distribution_seed: list[WarehouseStock],
    warehouse_a: Warehouse,
    second_product: Product,
):
    """Combined search + warehouse_id filter returns only the matching record."""
    response = await client.get(
        BASE,
        params={"warehouse_id": warehouse_a.warehouse_id, "search": "tablet"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["product_id"] == second_product.product_id
    assert data["items"][0]["warehouse_id"] == warehouse_a.warehouse_id


# ── Pagination ─────────────────────────────────────────────────────


async def test_pagination_page_size(
    client: AsyncClient,
    stock_distribution_seed: list[WarehouseStock],
):
    """page_size limits the number of items returned while total reflects full count."""
    response = await client.get(BASE, params={"page": 1, "page_size": 2})

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    assert len(data["items"]) == 2
    assert data["page"] == 1
    assert data["page_size"] == 2


async def test_pagination_second_page(
    client: AsyncClient,
    stock_distribution_seed: list[WarehouseStock],
):
    """Second page returns remaining items."""
    response = await client.get(BASE, params={"page": 2, "page_size": 2})

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    assert len(data["items"]) == 1
    assert data["page"] == 2


async def test_list_distribution_ordered_by_warehouse_and_product_name(
    client: AsyncClient,
    stock_distribution_seed: list[WarehouseStock],
):
    """Rows are ordered by warehouse name and then product name."""
    response = await client.get(BASE)

    assert response.status_code == 200
    items = response.json()["items"]
    ordered_pairs = [(item["warehouse_name"], item["product_name"]) for item in items]
    assert ordered_pairs == sorted(ordered_pairs)


# ── Auth ───────────────────────────────────────────────────────────


async def test_list_distribution_requires_auth(unauthenticated_client: AsyncClient):
    """Returns 401 when no authentication token is provided."""
    response = await unauthenticated_client.get(BASE)

    assert response.status_code == 401

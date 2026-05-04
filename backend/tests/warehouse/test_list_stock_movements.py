from datetime import UTC, datetime

import pytest_asyncio
from httpx import AsyncClient

from modules.catalog.domain.entities.product import Product
from modules.warehouse.domain.entities.warehouse import Warehouse

BASE = "/api/v1/warehouse/stock/movements"
ADJUST = "/api/v1/warehouse/stock/adjust"


# ── Fixtures ──────────────────────────────────────────────────────────


@pytest_asyncio.fixture
async def three_movements(
    client: AsyncClient,
    warehouse_a: Warehouse,
    sample_product: Product,
    second_product: Product,
) -> None:
    """Create 3 adjustment movements: 2 for sample_product, 1 for second_product."""
    await client.post(
        ADJUST,
        json={
            "warehouse_id": warehouse_a.warehouse_id,
            "product_id": sample_product.product_id,
            "new_quantity": 10,
            "reason": "Initial stock load",
        },
    )
    await client.post(
        ADJUST,
        json={
            "warehouse_id": warehouse_a.warehouse_id,
            "product_id": sample_product.product_id,
            "new_quantity": 20,
            "reason": "Quarterly recount",
        },
    )
    await client.post(
        ADJUST,
        json={
            "warehouse_id": warehouse_a.warehouse_id,
            "product_id": second_product.product_id,
            "new_quantity": 5,
            "reason": "Initial stock load",
        },
    )


# ── List — success cases ──────────────────────────────────────────────


async def test_list_movements_returns_paginated_shape(
    client: AsyncClient,
    three_movements: None,
):
    """Response has items, total, page, page_size fields."""
    response = await client.get(BASE, params={"page": 1, "page_size": 2})

    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert data["total"] == 3
    assert len(data["items"]) == 2
    assert data["page"] == 1
    assert data["page_size"] == 2


async def test_list_movements_item_fields(
    client: AsyncClient,
    three_movements: None,
):
    """Each item exposes the required fields."""
    response = await client.get(BASE, params={"page": 1, "page_size": 1})

    assert response.status_code == 200
    item = response.json()["items"][0]
    assert "movement_id" in item
    assert "product_id" in item
    assert "product_name" in item
    assert "movement_type" in item
    assert "difference" in item
    assert "reason" in item
    assert "created_at" in item


async def test_list_movements_sorted_desc(
    client: AsyncClient,
    three_movements: None,
):
    """Items are returned sorted by created_at descending."""
    response = await client.get(BASE)

    assert response.status_code == 200
    items = response.json()["items"]
    timestamps = [item["created_at"] for item in items]
    assert timestamps == sorted(timestamps, reverse=True)


# ── List — filters ────────────────────────────────────────────────────


async def test_filter_by_product_id(
    client: AsyncClient,
    three_movements: None,
    sample_product: Product,
):
    """Only movements for the requested product are returned."""
    response = await client.get(BASE, params={"product_id": sample_product.product_id})

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert all(
        item["product_id"] == sample_product.product_id for item in data["items"]
    )


async def test_filter_by_movement_type_matches(
    client: AsyncClient,
    three_movements: None,
):
    """Filtering by 'adjustment' returns all seeded movements."""
    response = await client.get(BASE, params={"movement_type": "adjustment"})

    assert response.status_code == 200
    assert response.json()["total"] == 3


async def test_filter_by_movement_type_no_match(
    client: AsyncClient,
    three_movements: None,
):
    """Filtering by 'inbound' returns zero results (none were created via purchases)."""
    response = await client.get(BASE, params={"movement_type": "inbound"})

    assert response.status_code == 200
    assert response.json()["total"] == 0


async def test_filter_by_date_from_future_returns_empty(
    client: AsyncClient,
    three_movements: None,
):
    """date_from in the future returns no movements."""
    future = datetime(2099, 1, 1, tzinfo=UTC).isoformat()
    response = await client.get(BASE, params={"date_from": future})

    assert response.status_code == 200
    assert response.json()["total"] == 0


async def test_filter_by_date_from_past_returns_all(
    client: AsyncClient,
    three_movements: None,
):
    """date_from in the past includes all seeded movements."""
    past = datetime(2000, 1, 1, tzinfo=UTC).isoformat()
    response = await client.get(BASE, params={"date_from": past})

    assert response.status_code == 200
    assert response.json()["total"] == 3


async def test_filter_by_date_to_past_returns_empty(
    client: AsyncClient,
    three_movements: None,
):
    """date_to in the past returns no movements."""
    past = datetime(2000, 1, 1, tzinfo=UTC).isoformat()
    response = await client.get(BASE, params={"date_to": past})

    assert response.status_code == 200
    assert response.json()["total"] == 0


async def test_filter_by_date_to_future_returns_all(
    client: AsyncClient,
    three_movements: None,
):
    """date_to in the future includes all seeded movements."""
    future = datetime(2099, 1, 1, tzinfo=UTC).isoformat()
    response = await client.get(BASE, params={"date_to": future})

    assert response.status_code == 200
    assert response.json()["total"] == 3


async def test_filter_by_reason_search_case_insensitive(
    client: AsyncClient,
    three_movements: None,
):
    """reason_search matches case-insensitively and returns only matching movements."""
    response = await client.get(BASE, params={"reason_search": "quarterly"})

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["reason"] == "Quarterly recount"


async def test_filter_by_reason_search_shared_substring(
    client: AsyncClient,
    three_movements: None,
):
    """reason_search on a shared substring returns all matching movements."""
    response = await client.get(BASE, params={"reason_search": "stock load"})

    assert response.status_code == 200
    assert response.json()["total"] == 2


async def test_filter_by_reason_search_no_match(
    client: AsyncClient,
    three_movements: None,
):
    """reason_search with no match returns empty list."""
    response = await client.get(BASE, params={"reason_search": "nonexistent-xyz"})

    assert response.status_code == 200
    assert response.json()["total"] == 0


# ── List — auth ───────────────────────────────────────────────────────


async def test_list_movements_unauthenticated_returns_401(
    unauthenticated_client: AsyncClient,
):
    """Returns 401 when no authentication token is provided."""
    response = await unauthenticated_client.get(BASE)

    assert response.status_code == 401


# ── Detail — success cases ────────────────────────────────────────────


async def test_get_detail_returns_full_data(
    client: AsyncClient,
    warehouse_a: Warehouse,
    sample_product: Product,
):
    """GET /movements/{id} returns all detail fields for a valid movement."""
    adjust_response = await client.post(
        ADJUST,
        json={
            "warehouse_id": warehouse_a.warehouse_id,
            "product_id": sample_product.product_id,
            "new_quantity": 42,
            "reason": "Detail test",
        },
    )
    movement_id = adjust_response.json()["movement_id"]

    response = await client.get(f"{BASE}/{movement_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["movement_id"] == movement_id
    assert data["warehouse_id"] == warehouse_a.warehouse_id
    assert data["product_id"] == sample_product.product_id
    assert data["product_name"] == sample_product.name
    assert data["movement_type"] == "adjustment"
    assert data["previous_quantity"] == 0
    assert data["new_quantity"] == 42
    assert data["difference"] == 42
    assert data["reason"] == "Detail test"
    assert "user_email" in data
    assert "created_at" in data


# ── Detail — not found ────────────────────────────────────────────────


async def test_get_detail_not_found_returns_404(client: AsyncClient):
    """Returns 404 with error_code 6205 when movement does not exist."""
    response = await client.get(f"{BASE}/999999")

    assert response.status_code == 404
    assert response.json()["error_code"] == 6205


# ── Detail — auth ─────────────────────────────────────────────────────


async def test_get_detail_unauthenticated_returns_401(
    unauthenticated_client: AsyncClient,
):
    """Returns 401 when no authentication token is provided."""
    response = await unauthenticated_client.get(f"{BASE}/1")

    assert response.status_code == 401

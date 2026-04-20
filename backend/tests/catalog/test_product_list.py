import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.catalog.domain.entities.category import Category
from modules.catalog.domain.entities.product import Product


@pytest.fixture
async def setup_products(db_session: AsyncSession):
    cat = Category(name="Electronics", description="Gadgets")
    db_session.add(cat)
    await db_session.flush()

    p1 = Product(
        product_code="P1",
        name="Apple",
        category_id=cat.category_id,
        price=10,
        stock_min=1,
    )
    p2 = Product(
        product_code="P2",
        name="Banana",
        category_id=cat.category_id,
        price=5,
        stock_min=1,
    )
    db_session.add_all([p1, p2])
    await db_session.flush()
    return cat


async def test_list_products_success(
    admin_client: AsyncClient, setup_products: Category
):
    response = await admin_client.get("/api/v1/catalog/products?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2
    # Check ordering (by name)
    names = [p["name"] for p in data["items"]]
    assert "Apple" in names
    assert "Banana" in names


async def test_list_products_filter_by_category(
    admin_client: AsyncClient, setup_products: Category, db_session: AsyncSession
):
    # Add product in another category
    cat2 = Category(name="Food", description="Food items")
    db_session.add(cat2)
    await db_session.flush()
    p3 = Product(
        product_code="P3",
        name="Pizza",
        category_id=cat2.category_id,
        price=12,
        stock_min=1,
    )
    db_session.add(p3)
    await db_session.flush()

    # List only Electronics
    response = await admin_client.get(
        f"/api/v1/catalog/products?category_id={setup_products.category_id}"
    )
    assert response.status_code == 200
    data = response.json()
    assert all(p["category_id"] == setup_products.category_id for p in data["items"])
    assert not any(p["name"] == "Pizza" for p in data["items"])


async def test_list_products_employee_allowed(
    non_admin_client: AsyncClient, setup_products: Category
):
    response = await non_admin_client.get("/api/v1/catalog/products")
    assert response.status_code == 200

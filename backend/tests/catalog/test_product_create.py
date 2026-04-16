import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.catalog.domain.entities.category import Category
from modules.catalog.domain.entities.product import Product


@pytest.fixture
async def sample_category(db_session: AsyncSession) -> Category:
    category = Category(name="Electronics", description="Gadgets")
    db_session.add(category)
    await db_session.flush()
    return category


async def test_create_product_success(
    purchases_manager_client: AsyncClient,
    db_session: AsyncSession,
    sample_category: Category,
):
    payload = {
        "name": "Smartphone",
        "description": "Latest model",
        "category_id": sample_category.category_id,
        "price": 599.50,
        "stock_min": 5,
    }
    response = await purchases_manager_client.post(
        "/api/v1/catalog/products", json=payload
    )

    assert response.status_code == 201
    data = response.json()
    assert data["product_code"] == "ELE-001"
    assert data["category_name"] == "Electronics"
    assert float(data["vat_rate"]) == 0.21

    # Verify DB
    result = await db_session.execute(
        select(Product).where(Product.product_id == data["product_id"])
    )
    product = result.scalar_one_or_none()
    assert product is not None
    assert product.product_code == "ELE-001"


async def test_create_product_custom_vat_rate(
    purchases_manager_client: AsyncClient,
    db_session: AsyncSession,
    sample_category: Category,
):
    payload = {
        "name": "Bread",
        "category_id": sample_category.category_id,
        "price": 1.50,
        "vat_rate": 0.04,
    }
    response = await purchases_manager_client.post(
        "/api/v1/catalog/products", json=payload
    )

    assert response.status_code == 201
    data = response.json()
    assert data["product_code"] == "ELE-001"
    assert float(data["vat_rate"]) == 0.04

    result = await db_session.execute(
        select(Product).where(Product.product_id == data["product_id"])
    )
    product = result.scalar_one_or_none()
    assert product is not None
    assert product.product_code == "ELE-001"
    assert float(product.vat_rate) == 0.04


async def test_create_product_generates_next_sequence_when_code_exists(
    admin_client: AsyncClient, db_session: AsyncSession, sample_category: Category
):
    existing_product = Product(
        product_code="ELE-001",
        name="X",
        category_id=sample_category.category_id,
        price=10,
        stock_min=0,
    )
    db_session.add(existing_product)
    await db_session.flush()

    payload = {
        "name": "Another",
        "category_id": sample_category.category_id,
        "price": 800.00,
    }
    response = await admin_client.post("/api/v1/catalog/products", json=payload)

    assert response.status_code == 201
    assert response.json()["product_code"] == "ELE-002"


async def test_create_product_invalid_category(admin_client: AsyncClient):
    payload = {
        "name": "Ghost",
        "category_id": 9999,
        "price": 10.00,
    }
    response = await admin_client.post("/api/v1/catalog/products", json=payload)

    assert response.status_code == 404
    assert response.json()["error_code"] == 5101


async def test_create_product_forbidden_for_other_manager(
    other_manager_client: AsyncClient, sample_category: Category
):
    payload = {
        "name": "Smartphone",
        "category_id": sample_category.category_id,
        "price": 100.00,
    }
    response = await other_manager_client.post("/api/v1/catalog/products", json=payload)
    assert response.status_code == 403


async def test_create_product_forbidden_for_employee(
    non_admin_client: AsyncClient, sample_category: Category
):
    payload = {
        "name": "Smartphone",
        "category_id": sample_category.category_id,
        "price": 100.00,
    }
    response = await non_admin_client.post("/api/v1/catalog/products", json=payload)
    assert response.status_code == 403

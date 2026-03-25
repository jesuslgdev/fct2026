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
        "product_code": "NEW-PROD-001",
        "name": "Smartphone",
        "description": "Latest model",
        "category_id": sample_category.category_id,
        "price": 599.50,
        "stock_current": 20,
        "stock_min": 5,
    }
    response = await purchases_manager_client.post(
        "/api/v1/catalog/products", json=payload
    )

    assert response.status_code == 201
    data = response.json()
    assert data["product_code"] == "NEW-PROD-001"
    assert data["category_name"] == "Electronics"

    # Verify DB
    result = await db_session.execute(
        select(Product).where(Product.product_code == "NEW-PROD-001")
    )
    assert result.scalar_one_or_none() is not None


async def test_create_product_duplicate_code(
    admin_client: AsyncClient, db_session: AsyncSession, sample_category: Category
):
    # Setup existing product
    p = Product(
        product_code="DUP-CODE",
        name="X",
        category_id=sample_category.category_id,
        price=10,
        stock_current=0,
        stock_min=0,
    )
    db_session.add(p)
    await db_session.flush()

    payload = {
        "product_code": "DUP-CODE",
        "name": "Another",
        "category_id": sample_category.category_id,
        "price": 800.00,
    }
    response = await admin_client.post("/api/v1/catalog/products", json=payload)

    assert response.status_code == 409
    assert response.json()["error_code"] == 5202


async def test_create_product_invalid_category(admin_client: AsyncClient):
    payload = {
        "product_code": "GHOST-PROD",
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
        "product_code": "FORBIDDEN-PROD",
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
        "product_code": "EMP-PROD",
        "name": "Smartphone",
        "category_id": sample_category.category_id,
        "price": 100.00,
    }
    response = await non_admin_client.post("/api/v1/catalog/products", json=payload)
    assert response.status_code == 403

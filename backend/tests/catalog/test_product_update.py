import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.catalog.domain.entities.category import Category
from modules.catalog.domain.entities.product import Product


@pytest.fixture
async def sample_product(db_session: AsyncSession) -> Product:
    cat = Category(name="Electronics", description="Gadgets")
    db_session.add(cat)
    await db_session.flush()

    product = Product(
        product_code="PROD-UPDATE",
        name="Laptop",
        category_id=cat.category_id,
        price=999.99,
        stock_current=10,
        stock_min=2,
        is_active=True,
    )
    db_session.add(product)
    await db_session.flush()
    return product


async def test_update_product_success(
    purchases_manager_client: AsyncClient, sample_product: Product
):
    payload = {"name": "Updated Laptop Name", "price": 1050.00}
    response = await purchases_manager_client.put(
        f"/api/v1/catalog/products/{sample_product.product_id}", json=payload
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Laptop Name"
    assert float(data["price"]) == 1050.00


async def test_update_product_duplicate_code(
    admin_client: AsyncClient, sample_product: Product, db_session: AsyncSession
):
    # Add another product
    p2 = Product(
        product_code="CODE-2",
        name="X",
        category_id=sample_product.category_id,
        price=10,
        stock_current=0,
        stock_min=0,
    )
    db_session.add(p2)
    await db_session.flush()

    payload = {"product_code": "CODE-2"}
    response = await admin_client.put(
        f"/api/v1/catalog/products/{sample_product.product_id}", json=payload
    )
    assert response.status_code == 409
    assert response.json()["error_code"] == 5202


async def test_update_product_forbidden_for_other_manager(
    other_manager_client: AsyncClient, sample_product: Product
):
    payload = {"name": "Hacked"}
    response = await other_manager_client.put(
        f"/api/v1/catalog/products/{sample_product.product_id}", json=payload
    )
    assert response.status_code == 403

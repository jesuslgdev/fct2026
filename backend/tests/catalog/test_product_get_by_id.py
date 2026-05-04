import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.catalog.domain.entities.category import Category
from modules.catalog.domain.entities.product import Product


@pytest.fixture
async def sample_product(db_session: AsyncSession) -> Product:
    category = Category(name="Electronics", description="Gadgets")
    db_session.add(category)
    await db_session.flush()

    product = Product(
        product_code="PROD-GET",
        name="Laptop",
        description="A powerful laptop",
        category_id=category.category_id,
        price=999.99,
        stock_min=2,
        is_active=True,
    )
    db_session.add(product)
    await db_session.flush()
    return product


async def test_get_product_by_id_success(
    admin_client: AsyncClient, sample_product: Product
):
    response = await admin_client.get(
        f"/api/v1/catalog/products/{sample_product.product_id}"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["product_code"] == "PROD-GET"
    assert data["category_name"] == "Electronics"


async def test_get_product_not_found(admin_client: AsyncClient):
    response = await admin_client.get("/api/v1/catalog/products/9999")
    assert response.status_code == 404
    assert response.json()["error_code"] == 5201


async def test_get_product_unauthenticated(
    non_admin_client: AsyncClient, sample_product: Product
):
    # Non-admin (Employee) SHOULD be able to get a product
    response = await non_admin_client.get(
        f"/api/v1/catalog/products/{sample_product.product_id}"
    )
    assert response.status_code == 200

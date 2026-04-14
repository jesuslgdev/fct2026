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
        product_code="PROD-ACTIVE",
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


async def test_set_product_active_success(
    admin_client: AsyncClient, db_session: AsyncSession, sample_product: Product
):
    # Deactivate
    response = await admin_client.patch(
        f"/api/v1/catalog/products/{sample_product.product_id}/active",
        json={"is_active": False},
    )
    assert response.status_code == 204

    await db_session.refresh(sample_product)
    assert sample_product.is_active is False


async def test_set_product_active_purchases_manager(
    purchases_manager_client: AsyncClient,
    db_session: AsyncSession,
    sample_product: Product,
):
    response = await purchases_manager_client.patch(
        f"/api/v1/catalog/products/{sample_product.product_id}/active",
        json={"is_active": False},
    )
    assert response.status_code == 204


async def test_set_product_active_forbidden_for_other_manager(
    other_manager_client: AsyncClient, sample_product: Product
):
    response = await other_manager_client.patch(
        f"/api/v1/catalog/products/{sample_product.product_id}/active",
        json={"is_active": False},
    )
    assert response.status_code == 403

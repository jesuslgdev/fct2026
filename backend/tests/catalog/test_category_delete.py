from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.catalog.domain.entities.category import Category


async def test_delete_category_success(
    admin_client: AsyncClient, db_session: AsyncSession
):
    category = Category(name="ToDelete", description="")
    db_session.add(category)
    await db_session.flush()

    response = await admin_client.delete(
        f"/api/v1/catalog/categories/{category.category_id}"
    )
    assert response.status_code == 204


async def test_delete_category_not_found(
    admin_client: AsyncClient, db_session: AsyncSession
):
    response = await admin_client.delete("/api/v1/catalog/categories/99999")
    assert response.status_code == 404
    assert response.json()["error_code"] == 5101


async def test_delete_category_unauthorized(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.delete("/api/v1/catalog/categories/1")
    assert response.status_code == 401


async def test_delete_category_forbidden(non_admin_client: AsyncClient):
    response = await non_admin_client.delete("/api/v1/catalog/categories/1")
    assert response.status_code == 403


async def test_delete_category_has_products(
    admin_client: AsyncClient, db_session: AsyncSession
):
    from modules.catalog.domain.entities.product import Product

    category = Category(name="CategoryWithProducts", description="")
    db_session.add(category)
    await db_session.flush()

    product = Product(
        product_code="CAT-DEL-PROD",
        name="SomeProduct",
        category_id=category.category_id,
        price=10,
        stock_current=0,
        stock_min=0,
    )
    db_session.add(product)
    await db_session.flush()

    response = await admin_client.delete(
        f"/api/v1/catalog/categories/{category.category_id}"
    )
    assert response.status_code == 409
    assert response.json()["error_code"] == 5103

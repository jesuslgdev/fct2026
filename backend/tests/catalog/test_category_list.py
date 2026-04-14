from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.catalog.domain.entities.category import Category


async def test_list_categories_empty(
    admin_client: AsyncClient, db_session: AsyncSession
):
    response = await admin_client.get("/api/v1/catalog/categories")
    assert response.status_code == 200
    assert response.json() == []


async def test_list_categories_returns_data(
    admin_client: AsyncClient, db_session: AsyncSession
):
    db_session.add(Category(name="Electronics", description="Electronic devices"))
    db_session.add(Category(name="Clothing", description="Apparel"))
    await db_session.flush()

    response = await admin_client.get("/api/v1/catalog/categories")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    # Should be ordered by name
    assert data[0]["name"] == "Clothing"
    assert data[1]["name"] == "Electronics"
    assert "category_id" in data[0]
    assert "description" in data[0]


async def test_list_categories_unauthorized(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.get("/api/v1/catalog/categories")
    assert response.status_code == 401


async def test_list_categories_non_admin_gets_200(
    non_admin_client: AsyncClient, db_session: AsyncSession
):
    response = await non_admin_client.get("/api/v1/catalog/categories")
    assert response.status_code == 200

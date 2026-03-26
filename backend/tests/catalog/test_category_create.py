from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.catalog.domain.entities.category import Category


async def test_create_category_success(
    admin_client: AsyncClient, db_session: AsyncSession
):
    response = await admin_client.post(
        "/api/v1/catalog/categories",
        json={"name": "Tools", "description": "Hand and power tools"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Tools"
    assert data["description"] == "Hand and power tools"
    assert "category_id" in data


async def test_create_category_duplicate_name(
    admin_client: AsyncClient, db_session: AsyncSession
):
    db_session.add(Category(name="Furniture", description=""))
    await db_session.flush()

    response = await admin_client.post(
        "/api/v1/catalog/categories",
        json={"name": "Furniture", "description": "New description"},
    )
    assert response.status_code == 409
    assert response.json()["error_code"] == 5102


async def test_create_category_empty_name(
    admin_client: AsyncClient, db_session: AsyncSession
):
    response = await admin_client.post(
        "/api/v1/catalog/categories",
        json={"name": "", "description": "Some description"},
    )
    assert response.status_code == 422


async def test_create_category_name_too_long(
    admin_client: AsyncClient, db_session: AsyncSession
):
    response = await admin_client.post(
        "/api/v1/catalog/categories",
        json={"name": "A" * 101, "description": "Some description"},
    )
    assert response.status_code == 422


async def test_create_category_unauthorized(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.post(
        "/api/v1/catalog/categories",
        json={"name": "Tools", "description": ""},
    )
    assert response.status_code == 401


async def test_create_category_forbidden(non_admin_client: AsyncClient):
    response = await non_admin_client.post(
        "/api/v1/catalog/categories",
        json={"name": "Tools", "description": ""},
    )
    assert response.status_code == 403

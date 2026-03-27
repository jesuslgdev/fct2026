from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.catalog.domain.entities.category import Category


async def test_update_category_success(
    admin_client: AsyncClient, db_session: AsyncSession
):
    category = Category(name="OldName", description="OldDesc")
    db_session.add(category)
    await db_session.flush()

    response = await admin_client.put(
        f"/api/v1/catalog/categories/{category.category_id}",
        json={"name": "NewName", "description": "NewDesc"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "NewName"
    assert data["description"] == "NewDesc"


async def test_update_category_partial_name_only(
    admin_client: AsyncClient, db_session: AsyncSession
):
    category = Category(name="PartialName", description="KeepThisDesc")
    db_session.add(category)
    await db_session.flush()

    response = await admin_client.put(
        f"/api/v1/catalog/categories/{category.category_id}",
        json={"name": "UpdatedName"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "UpdatedName"
    assert data["description"] == "KeepThisDesc"


async def test_update_category_partial_description_only(
    admin_client: AsyncClient, db_session: AsyncSession
):
    category = Category(name="KeepThisName", description="OldDesc")
    db_session.add(category)
    await db_session.flush()

    response = await admin_client.put(
        f"/api/v1/catalog/categories/{category.category_id}",
        json={"description": "UpdatedDesc"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "KeepThisName"
    assert data["description"] == "UpdatedDesc"


async def test_update_category_not_found(
    admin_client: AsyncClient, db_session: AsyncSession
):
    response = await admin_client.put(
        "/api/v1/catalog/categories/99999",
        json={"name": "DoesNotMatter"},
    )
    assert response.status_code == 404
    assert response.json()["error_code"] == 5101


async def test_update_category_duplicate_name(
    admin_client: AsyncClient, db_session: AsyncSession
):
    db_session.add(Category(name="ExistingCategory", description=""))
    target = Category(name="TargetCategory", description="")
    db_session.add(target)
    await db_session.flush()

    response = await admin_client.put(
        f"/api/v1/catalog/categories/{target.category_id}",
        json={"name": "ExistingCategory"},
    )
    assert response.status_code == 409
    assert response.json()["error_code"] == 5102


async def test_update_category_unauthorized(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.put(
        "/api/v1/catalog/categories/1",
        json={"name": "NewName"},
    )
    assert response.status_code == 401


async def test_update_category_forbidden(non_admin_client: AsyncClient):
    response = await non_admin_client.put(
        "/api/v1/catalog/categories/1",
        json={"name": "NewName"},
    )
    assert response.status_code == 403

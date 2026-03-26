from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.admin.domain.entities.department import Department


async def test_create_department_success(
    admin_client: AsyncClient, db_session: AsyncSession
):
    response = await admin_client.post(
        "/api/v1/admin/departments", json={"name": "Engineering"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Engineering"
    assert "department_id" in data


async def test_create_department_duplicate_name(
    admin_client: AsyncClient, db_session: AsyncSession
):
    db_session.add(Department(name="Finance"))
    await db_session.flush()

    response = await admin_client.post(
        "/api/v1/admin/departments", json={"name": "Finance"}
    )
    assert response.status_code == 409


async def test_create_department_empty_name(
    admin_client: AsyncClient, db_session: AsyncSession
):
    response = await admin_client.post("/api/v1/admin/departments", json={"name": ""})
    assert response.status_code == 422


async def test_create_department_unauthorized(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.post(
        "/api/v1/admin/departments", json={"name": "HR"}
    )
    assert response.status_code == 401


async def test_create_department_forbidden(non_admin_client: AsyncClient):
    response = await non_admin_client.post(
        "/api/v1/admin/departments", json={"name": "HR"}
    )
    assert response.status_code == 403

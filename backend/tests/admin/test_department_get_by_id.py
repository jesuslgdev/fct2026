from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.admin.domain.entities.department import Department


async def test_get_department_by_id_returns_data(
    client: AsyncClient, db_session: AsyncSession
):
    dept = Department(name="Engineering")
    db_session.add(dept)
    await db_session.flush()

    response = await client.get(f"/api/v1/admin/departments/{dept.department_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["department_id"] == dept.department_id
    assert data["name"] == "Engineering"


async def test_get_department_not_found(client: AsyncClient, db_session: AsyncSession):
    response = await client.get("/api/v1/admin/departments/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Department not found"


async def test_get_department_unauthorized(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.get("/api/v1/admin/departments/1")
    assert response.status_code == 403

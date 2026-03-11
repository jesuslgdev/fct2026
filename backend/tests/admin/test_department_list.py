from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.admin.domain.entities.department import Department


async def test_list_departments_empty(client: AsyncClient, db_session: AsyncSession):
    response = await client.get("/api/v1/admin/departments")
    assert response.status_code == 200
    assert response.json() == []


async def test_list_departments_returns_data(
    client: AsyncClient, db_session: AsyncSession
):
    db_session.add(Department(name="Accounting"))
    db_session.add(Department(name="Warehouse"))
    await db_session.flush()

    response = await client.get("/api/v1/admin/departments")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    # Should be ordered by name
    assert data[0]["name"] == "Accounting"
    assert data[1]["name"] == "Warehouse"
    assert "department_id" in data[0]


async def test_list_departments_unauthorized(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.get("/api/v1/admin/departments")
    assert response.status_code == 401

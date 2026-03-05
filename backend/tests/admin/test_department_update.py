from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.admin.domain.entities.department import Department


async def test_update_department_success(client: AsyncClient, db_session: AsyncSession):
    dept = Department(name="Original")
    db_session.add(dept)
    await db_session.flush()

    response = await client.put(
        f"/api/v1/admin/departments/{dept.department_id}", json={"name": "Updated"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated"
    assert data["department_id"] == dept.department_id


async def test_update_department_not_found(
    client: AsyncClient, db_session: AsyncSession
):
    response = await client.put(
        "/api/v1/admin/departments/99999", json={"name": "Ghost"}
    )
    assert response.status_code == 404


async def test_update_department_duplicate_name(
    client: AsyncClient, db_session: AsyncSession
):
    dept_a = Department(name="Alpha")
    dept_b = Department(name="Beta")
    db_session.add(dept_a)
    db_session.add(dept_b)
    await db_session.flush()

    response = await client.put(
        f"/api/v1/admin/departments/{dept_b.department_id}", json={"name": "Alpha"}
    )
    assert response.status_code == 409


async def test_update_department_empty_name(
    client: AsyncClient, db_session: AsyncSession
):
    dept = Department(name="ToUpdate")
    db_session.add(dept)
    await db_session.flush()

    response = await client.put(
        f"/api/v1/admin/departments/{dept.department_id}", json={"name": ""}
    )
    assert response.status_code == 422


async def test_update_department_unauthorized(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.put(
        "/api/v1/admin/departments/1", json={"name": "Unauthorized"}
    )
    assert response.status_code == 401

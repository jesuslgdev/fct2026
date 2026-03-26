from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.admin.domain.entities.department import Department
from shared.domain.entities.user import User


async def test_delete_department_success(
    admin_client: AsyncClient, db_session: AsyncSession
):
    dept = Department(name="ToDelete")
    db_session.add(dept)
    await db_session.flush()

    response = await admin_client.delete(
        f"/api/v1/admin/departments/{dept.department_id}"
    )
    assert response.status_code == 204


async def test_delete_department_not_found(
    admin_client: AsyncClient, db_session: AsyncSession
):
    response = await admin_client.delete("/api/v1/admin/departments/99999")
    assert response.status_code == 404


async def test_delete_department_has_users(
    admin_client: AsyncClient, db_session: AsyncSession
):
    dept = Department(name="DeptWithUsers")
    db_session.add(dept)
    await db_session.flush()

    user = User(
        first_name="John",
        last_name="Doe",
        email="john.doe@example.com",
        role="Employee",
        department_id=dept.department_id,
    )
    db_session.add(user)
    await db_session.flush()

    response = await admin_client.delete(
        f"/api/v1/admin/departments/{dept.department_id}"
    )
    assert response.status_code == 409


async def test_delete_department_unauthorized(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.delete("/api/v1/admin/departments/1")
    assert response.status_code == 401


async def test_delete_department_forbidden(non_admin_client: AsyncClient):
    response = await non_admin_client.delete("/api/v1/admin/departments/1")
    assert response.status_code == 403

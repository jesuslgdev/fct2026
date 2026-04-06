from datetime import UTC, datetime

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.admin.domain.entities.department import Department
from shared.domain.entities.user import User


async def test_update_user_full(admin_client: AsyncClient, db_session: AsyncSession):
    dept = Department(name="Sales")
    db_session.add(dept)
    user = User(
        first_name="Old", last_name="Name", email="update@example.com", role="Employee"
    )
    db_session.add(user)
    await db_session.flush()

    response = await admin_client.put(
        f"/api/v1/admin/users/{user.user_id}",
        json={
            "first_name": "New",
            "last_name": "Name",
            "role": "Manager",
            "department_id": dept.department_id,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "New"
    assert data["role"] == "Manager"
    assert data["department_id"] == dept.department_id


async def test_update_user_partial(admin_client: AsyncClient, db_session: AsyncSession):
    dept = Department(name="Operations")
    db_session.add(dept)
    await db_session.flush()
    user = User(
        first_name="John",
        last_name="Doe",
        email="partial@example.com",
        role="Employee",
        department_id=dept.department_id,
        is_active=True,
        last_login_at=datetime.now(UTC),
    )
    db_session.add(user)
    await db_session.flush()

    response = await admin_client.put(
        f"/api/v1/admin/users/{user.user_id}",
        json={"first_name": "Updated"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Updated"
    assert data["last_name"] == "Doe"
    assert data["role"] == "Employee"


async def test_update_user_not_found(admin_client: AsyncClient):
    response = await admin_client.put(
        "/api/v1/admin/users/99999",
        json={"first_name": "Ghost"},
    )
    assert response.status_code == 404


async def test_update_user_department_not_found(
    admin_client: AsyncClient, db_session: AsyncSession
):
    user = User(
        first_name="John",
        last_name="Doe",
        email="deptcheck@example.com",
        role="Employee",
    )
    db_session.add(user)
    await db_session.flush()

    response = await admin_client.put(
        f"/api/v1/admin/users/{user.user_id}",
        json={"department_id": 99999},
    )
    assert response.status_code == 404


async def test_update_user_unauthorized(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.put(
        "/api/v1/admin/users/1", json={"first_name": "Ghost"}
    )
    assert response.status_code == 401


async def test_update_user_forbidden(non_admin_client: AsyncClient):
    response = await non_admin_client.put(
        "/api/v1/admin/users/1", json={"first_name": "Ghost"}
    )
    assert response.status_code == 403

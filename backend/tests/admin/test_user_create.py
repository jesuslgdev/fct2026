from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.admin.domain.entities.department import Department
from shared.domain.entities.user import User


async def test_create_user_success(admin_client: AsyncClient):
    response = await admin_client.post(
        "/api/v1/admin/users",
        json={
            "first_name": "Jane",
            "last_name": "Doe",
            "email": "jane@example.com",
            "role": "Employee",
        },
    )
    assert response.status_code == 201
    data = response.json()
    # Newly created users are inactive pending first login; personal data is masked.
    assert data["first_name"] == "Jane"
    assert data["email"] is None
    assert data["last_name"] is None
    assert data["role"] == "Employee"
    assert "user_id" in data
    assert data["is_active"] is False
    assert data["last_login_at"] is None


async def test_create_user_with_department(
    admin_client: AsyncClient, db_session: AsyncSession
):
    dept = Department(name="Engineering")
    db_session.add(dept)
    await db_session.flush()

    response = await admin_client.post(
        "/api/v1/admin/users",
        json={
            "first_name": "Mark",
            "last_name": "Smith",
            "email": "mark@example.com",
            "role": "Employee",
            "department_id": dept.department_id,
        },
    )
    assert response.status_code == 201
    assert response.json()["department_id"] == dept.department_id


async def test_create_user_duplicate_email(
    admin_client: AsyncClient, db_session: AsyncSession
):
    db_session.add(
        User(
            first_name="Existing",
            last_name="User",
            email="existing@example.com",
            role="Employee",
        )
    )
    await db_session.flush()

    response = await admin_client.post(
        "/api/v1/admin/users",
        json={
            "first_name": "New",
            "last_name": "User",
            "email": "existing@example.com",
            "role": "Employee",
        },
    )
    assert response.status_code == 409


async def test_create_user_invalid_role(admin_client: AsyncClient):
    response = await admin_client.post(
        "/api/v1/admin/users",
        json={
            "first_name": "Jane",
            "last_name": "Doe",
            "email": "jane2@example.com",
            "role": "InvalidRole",
        },
    )
    assert response.status_code == 422


async def test_create_user_missing_fields(admin_client: AsyncClient):
    response = await admin_client.post(
        "/api/v1/admin/users", json={"first_name": "Jane"}
    )
    assert response.status_code == 422


async def test_create_user_department_not_found(admin_client: AsyncClient):
    response = await admin_client.post(
        "/api/v1/admin/users",
        json={
            "first_name": "Jane",
            "last_name": "Doe",
            "email": "jane3@example.com",
            "role": "Employee",
            "department_id": 99999,
        },
    )
    assert response.status_code == 404


async def test_create_user_unauthorized(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.post(
        "/api/v1/admin/users",
        json={
            "first_name": "Jane",
            "last_name": "Doe",
            "email": "jane4@example.com",
            "role": "Employee",
        },
    )
    assert response.status_code == 401


async def test_create_user_forbidden(non_admin_client: AsyncClient):
    response = await non_admin_client.post(
        "/api/v1/admin/users",
        json={
            "first_name": "Jane",
            "last_name": "Doe",
            "email": "jane5@example.com",
            "role": "Employee",
        },
    )
    assert response.status_code == 403

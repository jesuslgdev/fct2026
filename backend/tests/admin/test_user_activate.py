from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.admin.domain.entities.department import Department
from shared.domain.entities.user import User


async def test_activate_user_success(
    admin_client: AsyncClient, db_session: AsyncSession
):
    dept = Department(name="Marketing")
    db_session.add(dept)
    user = User(
        first_name="DELETED",
        last_name="DELETED",
        email="deleted_0@deleted.com",
        role="Employee",
        is_active=False,
    )
    db_session.add(user)
    await db_session.flush()
    user.email = f"deleted_{user.user_id}@deleted.com"
    user.department_id = dept.department_id
    await db_session.flush()

    response = await admin_client.patch(
        f"/api/v1/admin/users/{user.user_id}/activate",
        json={
            "first_name": "Alice",
            "last_name": "Restored",
            "email": "alice.restored@example.com",
        },
    )
    assert response.status_code == 204

    await db_session.refresh(user)
    assert user.is_active is True
    assert user.first_name == "Alice"
    assert user.last_name == "Restored"
    assert user.email == "alice.restored@example.com"


async def test_activate_user_already_active(
    admin_client: AsyncClient, db_session: AsyncSession
):
    user = User(
        first_name="Carol",
        last_name="White",
        email="carol@example.com",
        role="Employee",
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    response = await admin_client.patch(
        f"/api/v1/admin/users/{user.user_id}/activate",
        json={
            "first_name": "Carol",
            "last_name": "White",
            "email": "carol@example.com",
        },
    )
    assert response.status_code == 409
    assert response.json()["error_code"] == 1206


async def test_activate_user_duplicate_email(
    admin_client: AsyncClient, db_session: AsyncSession
):
    existing = User(
        first_name="Existing",
        last_name="User",
        email="taken@example.com",
        role="Employee",
        is_active=True,
    )
    dept = Department(name="Legal")
    db_session.add(existing)
    db_session.add(dept)
    await db_session.flush()

    inactive = User(
        first_name="DELETED",
        last_name="DELETED",
        email="deleted_0@deleted.com",
        role="Employee",
        is_active=False,
    )
    db_session.add(inactive)
    await db_session.flush()
    inactive.email = f"deleted_{inactive.user_id}@deleted.com"
    inactive.department_id = dept.department_id
    await db_session.flush()

    response = await admin_client.patch(
        f"/api/v1/admin/users/{inactive.user_id}/activate",
        json={
            "first_name": "New",
            "last_name": "Person",
            "email": "taken@example.com",
        },
    )
    assert response.status_code == 409
    assert response.json()["error_code"] == 1202


async def test_activate_user_not_found(admin_client: AsyncClient):
    response = await admin_client.patch(
        "/api/v1/admin/users/99999/activate",
        json={
            "first_name": "Ghost",
            "last_name": "User",
            "email": "ghost@example.com",
        },
    )
    assert response.status_code == 404


async def test_activate_user_unauthorized(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.patch(
        "/api/v1/admin/users/1/activate",
        json={"first_name": "A", "last_name": "B", "email": "a@b.com"},
    )
    assert response.status_code == 401


async def test_activate_user_forbidden(non_admin_client: AsyncClient):
    response = await non_admin_client.patch(
        "/api/v1/admin/users/1/activate",
        json={"first_name": "A", "last_name": "B", "email": "a@b.com"},
    )
    assert response.status_code == 403

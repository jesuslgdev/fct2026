from datetime import UTC, datetime

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.admin.domain.entities.department import Department
from shared.domain.entities.user import User


async def test_deactivate_user_success(
    admin_client: AsyncClient, db_session: AsyncSession
):
    dept = Department(name="Finance")
    db_session.add(dept)
    user = User(
        first_name="Alice",
        last_name="Smith",
        email="alice@example.com",
        role="Employee",
        department_id=None,
        is_active=True,
        last_login_at=datetime.now(UTC),
    )
    db_session.add(user)
    await db_session.flush()
    user.department_id = dept.department_id
    await db_session.flush()

    response = await admin_client.patch(
        f"/api/v1/admin/users/{user.user_id}/deactivate"
    )
    assert response.status_code == 204

    await db_session.refresh(user)
    assert user.is_active is False
    assert user.is_deleted is False
    assert user.first_name == "Alice"
    assert user.last_name == "Smith"
    assert user.email == "alice@example.com"


async def test_deactivate_user_already_inactive(
    admin_client: AsyncClient, db_session: AsyncSession
):
    user = User(
        first_name="Bob",
        last_name="Jones",
        email="bob@example.com",
        role="Employee",
        is_active=False,
    )
    db_session.add(user)
    await db_session.flush()

    response = await admin_client.patch(
        f"/api/v1/admin/users/{user.user_id}/deactivate"
    )
    assert response.status_code == 409
    assert response.json()["error_code"] == 1207


async def test_deactivate_user_not_found(admin_client: AsyncClient):
    response = await admin_client.patch("/api/v1/admin/users/99999/deactivate")
    assert response.status_code == 404


async def test_deactivate_user_unauthorized(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.patch("/api/v1/admin/users/1/deactivate")
    assert response.status_code == 401


async def test_deactivate_user_forbidden(non_admin_client: AsyncClient):
    response = await non_admin_client.patch("/api/v1/admin/users/1/deactivate")
    assert response.status_code == 403

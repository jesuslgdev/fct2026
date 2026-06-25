from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from shared.domain.entities.user import User


async def test_activate_user_success(
    admin_client: AsyncClient, db_session: AsyncSession
):
    user = User(
        first_name="Alice",
        last_name="Smith",
        email="alice@example.com",
        role="Employee",
        is_active=False,
    )
    db_session.add(user)
    await db_session.flush()

    response = await admin_client.patch(
        f"/api/v1/admin/users/{user.user_id}/activate",
    )
    assert response.status_code == 204

    await db_session.refresh(user)
    assert user.is_active is True
    assert user.first_name == "Alice"
    assert user.last_name == "Smith"
    assert user.email == "alice@example.com"


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
    )
    assert response.status_code == 409
    assert response.json()["error_code"] == 1206


async def test_activate_deleted_user_fails(
    admin_client: AsyncClient, db_session: AsyncSession
):
    user = User(
        first_name="DELETED",
        last_name="DELETED",
        email="deleted_0@deleted.com",
        role="Employee",
        is_active=False,
        is_deleted=True,
    )
    db_session.add(user)
    await db_session.flush()

    response = await admin_client.patch(
        f"/api/v1/admin/users/{user.user_id}/activate",
    )
    assert response.status_code == 409
    assert response.json()["error_code"] == 1208


async def test_activate_user_not_found(admin_client: AsyncClient):
    response = await admin_client.patch(
        "/api/v1/admin/users/99999/activate",
    )
    assert response.status_code == 404


async def test_activate_user_unauthorized(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.patch(
        "/api/v1/admin/users/1/activate",
    )
    assert response.status_code == 401


async def test_activate_user_forbidden(non_admin_client: AsyncClient):
    response = await non_admin_client.patch(
        "/api/v1/admin/users/1/activate",
    )
    assert response.status_code == 403

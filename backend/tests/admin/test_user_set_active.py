from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from shared.domain.entities.user import User


async def test_set_user_active(admin_client: AsyncClient, db_session: AsyncSession):
    user = User(
        first_name="John",
        last_name="Doe",
        email="activate@example.com",
        role="Employee",
        is_active=False,
    )
    db_session.add(user)
    await db_session.flush()

    response = await admin_client.patch(
        f"/api/v1/admin/users/{user.user_id}/active",
        json={"is_active": True},
    )
    assert response.status_code == 204

    get_response = await admin_client.get(f"/api/v1/admin/users/{user.user_id}")
    assert get_response.status_code == 200
    assert get_response.json()["is_active"] is True


async def test_set_user_inactive(admin_client: AsyncClient, db_session: AsyncSession):
    user = User(
        first_name="Jane",
        last_name="Doe",
        email="deactivate@example.com",
        role="Employee",
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    response = await admin_client.patch(
        f"/api/v1/admin/users/{user.user_id}/active",
        json={"is_active": False},
    )
    assert response.status_code == 204

    get_response = await admin_client.get(f"/api/v1/admin/users/{user.user_id}")
    assert get_response.status_code == 200
    assert get_response.json()["is_active"] is False


async def test_set_user_active_not_found(admin_client: AsyncClient):
    response = await admin_client.patch(
        "/api/v1/admin/users/99999/active",
        json={"is_active": True},
    )
    assert response.status_code == 404


async def test_set_user_active_unauthorized(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.patch(
        "/api/v1/admin/users/1/active", json={"is_active": True}
    )
    assert response.status_code == 401


async def test_set_user_active_forbidden(non_admin_client: AsyncClient):
    response = await non_admin_client.patch(
        "/api/v1/admin/users/1/active", json={"is_active": True}
    )
    assert response.status_code == 403

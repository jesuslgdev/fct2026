from datetime import UTC, datetime

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from shared.domain.entities.user import User


async def test_get_user_success(admin_client: AsyncClient, db_session: AsyncSession):
    # User with last_login_at set → personal data is visible.
    user = User(
        first_name="John",
        last_name="Doe",
        email="john@example.com",
        role="Employee",
        is_active=True,
        last_login_at=datetime.now(UTC),
    )
    db_session.add(user)
    await db_session.flush()

    response = await admin_client.get(f"/api/v1/admin/users/{user.user_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == user.user_id
    assert data["email"] == "john@example.com"
    assert data["first_name"] == "John"
    assert data["last_name"] == "Doe"


async def test_get_user_pending_first_login(
    admin_client: AsyncClient, db_session: AsyncSession
):
    # User without last_login_at → email and last_name are masked.
    user = User(
        first_name="Pending",
        last_name="User",
        email="pending@example.com",
        role="Employee",
        is_active=False,
    )
    db_session.add(user)
    await db_session.flush()

    response = await admin_client.get(f"/api/v1/admin/users/{user.user_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Pending"
    assert data["email"] is None
    assert data["last_name"] is None
    assert data["last_login_at"] is None


async def test_get_user_not_found(admin_client: AsyncClient):
    response = await admin_client.get("/api/v1/admin/users/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"


async def test_get_user_unauthorized(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.get("/api/v1/admin/users/1")
    assert response.status_code == 401


async def test_get_user_forbidden(non_admin_client: AsyncClient):
    response = await non_admin_client.get("/api/v1/admin/users/1")
    assert response.status_code == 403

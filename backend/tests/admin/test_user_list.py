from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from shared.domain.entities.user import User


async def test_list_users_response_structure(admin_client: AsyncClient):
    # The DB may contain pre-seeded users; verify response shape, not exact count.
    response = await admin_client.get("/api/v1/admin/users")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert isinstance(data["items"], list)
    assert isinstance(data["total"], int)


async def test_list_users_returns_data(
    admin_client: AsyncClient, db_session: AsyncSession
):
    baseline = (await admin_client.get("/api/v1/admin/users")).json()["total"]

    db_session.add(
        User(
            first_name="Alice",
            last_name="Smith",
            email="alice@example.com",
            role="Employee",
        )
    )
    db_session.add(
        User(
            first_name="Bob", last_name="Jones", email="bob@example.com", role="Manager"
        )
    )
    await db_session.flush()

    response = await admin_client.get("/api/v1/admin/users")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == baseline + 2
    assert len(data["items"]) >= 2
    assert "user_id" in data["items"][0]


async def test_list_users_pagination(
    admin_client: AsyncClient, db_session: AsyncSession
):
    baseline = (await admin_client.get("/api/v1/admin/users")).json()["total"]

    for i in range(5):
        db_session.add(
            User(
                first_name=f"User{i}",
                last_name="Test",
                email=f"user{i}@example.com",
                role="Employee",
            )
        )
    await db_session.flush()

    response = await admin_client.get("/api/v1/admin/users?page=1&page_size=2")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == baseline + 5
    assert len(data["items"]) == 2
    assert data["page"] == 1
    assert data["page_size"] == 2


async def test_list_users_unauthorized(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.get("/api/v1/admin/users")
    assert response.status_code == 401


async def test_list_users_forbidden(non_admin_client: AsyncClient):
    response = await non_admin_client.get("/api/v1/admin/users")
    assert response.status_code == 403

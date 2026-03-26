from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from shared.domain.entities.user import User


async def _seed_users(db: AsyncSession) -> list[User]:
    users = [
        User(
            first_name="Alice",
            last_name="Smith",
            email="alice@example.com",
            role="Employee",
            is_active=True,
        ),
        User(
            first_name="Bob",
            last_name="Jones",
            email="bob@example.com",
            role="Manager",
            is_active=True,
        ),
        User(
            first_name="Carlos",
            last_name="Garcia",
            email="carlos@example.com",
            role="Administrator",
            is_active=False,
        ),
        User(
            first_name="Diana",
            last_name="Alonso",
            email="diana@example.com",
            role="Employee",
            is_active=False,
        ),
    ]
    for u in users:
        db.add(u)
    await db.flush()
    return users


async def test_filter_by_search_first_name(
    admin_client: AsyncClient, db_session: AsyncSession
):
    await _seed_users(db_session)
    response = await admin_client.get("/api/v1/admin/users?search=Alice")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert all("Alice" in u["first_name"] for u in data["items"])


async def test_filter_by_search_last_name(
    admin_client: AsyncClient, db_session: AsyncSession
):
    await _seed_users(db_session)
    response = await admin_client.get("/api/v1/admin/users?search=Garcia")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert all("Garcia" in u["last_name"] for u in data["items"])


async def test_filter_by_search_email(
    admin_client: AsyncClient, db_session: AsyncSession
):
    await _seed_users(db_session)
    response = await admin_client.get("/api/v1/admin/users?search=bob@example")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert all("bob" in u["email"] for u in data["items"])


async def test_filter_by_search_case_insensitive(
    admin_client: AsyncClient, db_session: AsyncSession
):
    await _seed_users(db_session)
    response = await admin_client.get("/api/v1/admin/users?search=alice")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert all("Alice" in u["first_name"] for u in data["items"])


async def test_filter_by_role(admin_client: AsyncClient, db_session: AsyncSession):
    await _seed_users(db_session)
    response = await admin_client.get("/api/v1/admin/users?role=Manager")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert all(u["role"] == "Manager" for u in data["items"])


async def test_filter_by_role_invalid(
    admin_client: AsyncClient, db_session: AsyncSession
):
    response = await admin_client.get("/api/v1/admin/users?role=InvalidRole")
    assert response.status_code == 422


async def test_filter_by_active_true(
    admin_client: AsyncClient, db_session: AsyncSession
):
    await _seed_users(db_session)
    response = await admin_client.get("/api/v1/admin/users?active=true")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert all(u["is_active"] is True for u in data["items"])


async def test_filter_by_active_false(
    admin_client: AsyncClient, db_session: AsyncSession
):
    await _seed_users(db_session)
    response = await admin_client.get("/api/v1/admin/users?active=false")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert all(u["is_active"] is False for u in data["items"])


async def test_filter_combined_search_and_role(
    admin_client: AsyncClient, db_session: AsyncSession
):
    await _seed_users(db_session)
    response = await admin_client.get("/api/v1/admin/users?search=Alice&role=Employee")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    for u in data["items"]:
        assert "Alice" in u["first_name"]
        assert u["role"] == "Employee"


async def test_filter_combined_role_and_active(
    admin_client: AsyncClient, db_session: AsyncSession
):
    await _seed_users(db_session)
    response = await admin_client.get("/api/v1/admin/users?role=Employee&active=false")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    for u in data["items"]:
        assert u["role"] == "Employee"
        assert u["is_active"] is False


async def test_filter_combined_all(admin_client: AsyncClient, db_session: AsyncSession):
    await _seed_users(db_session)
    response = await admin_client.get(
        "/api/v1/admin/users?search=Carlos&role=Administrator&active=false"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    for u in data["items"]:
        assert "Carlos" in u["first_name"]
        assert u["role"] == "Administrator"
        assert u["is_active"] is False


async def test_filter_no_results(admin_client: AsyncClient, db_session: AsyncSession):
    await _seed_users(db_session)
    response = await admin_client.get("/api/v1/admin/users?search=NonExistentName12345")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["items"] == []


async def test_filter_with_pagination(
    admin_client: AsyncClient, db_session: AsyncSession
):
    await _seed_users(db_session)
    response = await admin_client.get(
        "/api/v1/admin/users?role=Employee&page=1&page_size=1"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 2
    assert len(data["items"]) == 1
    assert data["page"] == 1
    assert data["page_size"] == 1

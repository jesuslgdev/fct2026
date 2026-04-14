from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.clients.domain.entities.client import Client


async def _seed_clients(db: AsyncSession) -> None:
    """Insert a set of clients with varied data for filter testing."""
    clients = [
        Client(
            name="Acme Corp",
            tax_id="12345678A",
            street="Calle Mayor 1",
            city="Madrid",
            province="Madrid",
            postal_code="28001",
            phone="600000001",
            email="acme@example.com",
            is_active=True,
        ),
        Client(
            name="Beta SL",
            tax_id="B1234567A",
            street="Avenida Diagonal 2",
            city="Barcelona",
            province="Barcelona",
            postal_code="08001",
            phone="600000002",
            email="beta@example.com",
            is_active=True,
        ),
        Client(
            name="Gamma SA",
            tax_id="12345679B",
            street="Plaza España 3",
            city="Seville",
            province="Sevilla",
            postal_code="41001",
            phone="600000003",
            email="gamma@example.com",
            is_active=False,
        ),
    ]
    db.add_all(clients)
    await db.flush()


async def test_list_no_filters_returns_all(
    any_user_client: AsyncClient, db_session: AsyncSession
):
    await _seed_clients(db_session)
    response = await any_user_client.get("/api/v1/clients")
    assert response.status_code == 200
    assert response.json()["total"] == 3


async def test_filter_search_by_name(
    any_user_client: AsyncClient, db_session: AsyncSession
):
    await _seed_clients(db_session)
    response = await any_user_client.get("/api/v1/clients?search=acme")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "Acme Corp"


async def test_filter_search_by_tax_id(
    any_user_client: AsyncClient, db_session: AsyncSession
):
    await _seed_clients(db_session)
    response = await any_user_client.get("/api/v1/clients?search=B1234567A")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "Beta SL"


async def test_filter_search_by_email(
    any_user_client: AsyncClient, db_session: AsyncSession
):
    await _seed_clients(db_session)
    response = await any_user_client.get("/api/v1/clients?search=gamma@")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "Gamma SA"


async def test_filter_active_true(
    any_user_client: AsyncClient, db_session: AsyncSession
):
    await _seed_clients(db_session)
    response = await any_user_client.get("/api/v1/clients?active=true")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert all(item["is_active"] for item in data["items"])


async def test_filter_active_false(
    any_user_client: AsyncClient, db_session: AsyncSession
):
    await _seed_clients(db_session)
    response = await any_user_client.get("/api/v1/clients?active=false")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert not data["items"][0]["is_active"]


async def test_filter_search_and_active_combined(
    any_user_client: AsyncClient, db_session: AsyncSession
):
    await _seed_clients(db_session)
    response = await any_user_client.get(
        "/api/v1/clients?search=example.com&active=true"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert all(item["is_active"] for item in data["items"])


async def test_filter_search_no_match(
    any_user_client: AsyncClient, db_session: AsyncSession
):
    await _seed_clients(db_session)
    response = await any_user_client.get("/api/v1/clients?search=nonexistent")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["items"] == []

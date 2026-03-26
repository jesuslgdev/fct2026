from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.clients.domain.entities.client import Client


async def test_list_clients_empty(any_user_client: AsyncClient):
    response = await any_user_client.get("/api/v1/clients")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["page"] == 1


async def test_list_clients_returns_data(
    any_user_client: AsyncClient, db_session: AsyncSession
):
    db_session.add(
        Client(
            name="Acme Corp",
            tax_id="12345678A",
            address="Calle Mayor 1",
            city="Madrid",
            province="Madrid",
            postal_code="28001",
            phone="600000001",
            email="acme@example.com",
        )
    )
    db_session.add(
        Client(
            name="Beta SL",
            tax_id="B1234567A",
            address="Avenida Diagonal 2",
            city="Barcelona",
            province="Barcelona",
            postal_code="08001",
            phone="600000002",
            email="beta@example.com",
        )
    )
    await db_session.flush()

    response = await any_user_client.get("/api/v1/clients")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2


async def test_list_clients_pagination_structure(any_user_client: AsyncClient):
    response = await any_user_client.get("/api/v1/clients?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert data["page"] == 1
    assert data["page_size"] == 10


async def test_list_clients_item_shape(
    any_user_client: AsyncClient, db_session: AsyncSession
):
    db_session.add(
        Client(
            name="Gamma SA",
            tax_id="12345679B",
            address="Plaza España 3",
            city="Seville",
            province="Sevilla",
            postal_code="41001",
            phone="600000003",
            email="gamma@example.com",
        )
    )
    await db_session.flush()

    response = await any_user_client.get("/api/v1/clients")
    assert response.status_code == 200
    item = response.json()["items"][0]
    assert "client_id" in item
    assert "name" in item
    assert "tax_id" in item
    assert "city" in item
    assert "is_active" in item
    # ClientDTO must NOT expose detailed address fields
    assert "address" not in item
    assert "email" not in item


async def test_list_clients_unauthenticated(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.get("/api/v1/clients")
    assert response.status_code == 401

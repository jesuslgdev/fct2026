from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.clients.domain.entities.client import Client


async def test_get_client_success(
    any_user_client: AsyncClient, db_session: AsyncSession
):
    client = Client(
        name="Acme Corp",
        tax_id="12345678A",
        address="Calle Mayor 1",
        city="Madrid",
        province="Madrid",
        postal_code="28001",
        phone="600000001",
        email="acme@example.com",
    )
    db_session.add(client)
    await db_session.flush()

    response = await any_user_client.get(f"/api/v1/clients/{client.client_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["client_id"] == client.client_id
    assert data["name"] == "Acme Corp"
    assert data["tax_id"] == "12345678A"
    assert data["city"] == "Madrid"
    assert data["is_active"] is True


async def test_get_client_detail_shape(
    any_user_client: AsyncClient, db_session: AsyncSession
):
    client = Client(
        name="Detail Corp",
        tax_id="87654321B",
        address="Gran Vía 10",
        city="Madrid",
        province="Madrid",
        postal_code="28013",
        phone="600000010",
        email="detail@example.com",
    )
    db_session.add(client)
    await db_session.flush()

    response = await any_user_client.get(f"/api/v1/clients/{client.client_id}")
    assert response.status_code == 200
    data = response.json()
    # ClientDetailDTO fields
    assert "address" in data
    assert "province" in data
    assert "postal_code" in data
    assert "phone" in data
    assert "email" in data


async def test_get_client_not_found(any_user_client: AsyncClient):
    response = await any_user_client.get("/api/v1/clients/99999")
    assert response.status_code == 404
    body = response.json()
    assert body["error_code"] == 4101


async def test_get_client_unauthenticated(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.get("/api/v1/clients/1")
    assert response.status_code == 401

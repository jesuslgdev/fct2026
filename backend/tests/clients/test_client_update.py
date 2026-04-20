from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.clients.domain.entities.client import Client


async def _seed_client(db_session: AsyncSession) -> Client:
    """Insert a client and return the flushed ORM instance."""
    client = Client(
        name="Original Name",
        tax_id="12345678A",
        street="Calle Mayor 1",
        city="Madrid",
        province="Madrid",
        postal_code="28001",
        phone="600000001",
        email="original@example.com",
    )
    db_session.add(client)
    await db_session.flush()
    return client


async def test_update_client_success(
    sales_manager_client: AsyncClient, db_session: AsyncSession
):
    client = await _seed_client(db_session)
    payload = {
        "name": "Updated Name",
        "address": {
            "street": "Nueva Calle 99",
            "city": "Barcelona",
            "province": "Barcelona",
            "postal_code": "08001",
        },
        "phone": "611111111",
        "email": "updated@example.com",
    }
    response = await sales_manager_client.put(
        f"/api/v1/clients/{client.client_id}", json=payload
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["city"] == "Barcelona"
    assert data["address"]["street"] == "Nueva Calle 99"
    assert data["email"] == "updated@example.com"


async def test_update_client_partial(
    sales_manager_client: AsyncClient, db_session: AsyncSession
):
    client = await _seed_client(db_session)
    response = await sales_manager_client.put(
        f"/api/v1/clients/{client.client_id}", json={"name": "Partial Update"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Partial Update"
    # Unchanged fields keep their original values
    assert data["city"] == "Madrid"
    assert data["email"] == "original@example.com"


async def test_update_client_not_found(sales_manager_client: AsyncClient):
    response = await sales_manager_client.put(
        "/api/v1/clients/99999", json={"name": "Ghost"}
    )
    assert response.status_code == 404
    assert response.json()["error_code"] == 4101


async def test_update_client_duplicate_email(
    sales_manager_client: AsyncClient, db_session: AsyncSession
):
    source_client = await _seed_client(db_session)
    target_client = Client(
        name="Second Client",
        tax_id="87654321B",
        street="Avenida 2",
        city="Sevilla",
        province="Sevilla",
        postal_code="41001",
        phone="622222222",
        email="second@example.com",
    )
    db_session.add(target_client)
    await db_session.flush()

    response = await sales_manager_client.put(
        f"/api/v1/clients/{source_client.client_id}",
        json={"email": "second@example.com"},
    )
    assert response.status_code == 409
    assert response.json()["error_code"] == 4104


async def test_update_client_invalid_email_format(
    sales_manager_client: AsyncClient, db_session: AsyncSession
):
    client = await _seed_client(db_session)
    response = await sales_manager_client.put(
        f"/api/v1/clients/{client.client_id}", json={"email": "invalid-email"}
    )
    assert response.status_code == 422


async def test_update_client_unauthenticated(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.put(
        "/api/v1/clients/1", json={"name": "Ghost"}
    )
    assert response.status_code == 401


async def test_update_client_forbidden(
    non_sales_client: AsyncClient, db_session: AsyncSession
):
    client = await _seed_client(db_session)
    response = await non_sales_client.put(
        f"/api/v1/clients/{client.client_id}", json={"name": "Forbidden"}
    )
    assert response.status_code == 403

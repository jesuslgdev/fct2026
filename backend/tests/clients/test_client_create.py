from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.clients.domain.entities.client import Client

VALID_PAYLOAD = {
    "name": "Acme Corp",
    "tax_id": "12345678A",
    "address": {
        "street": "Calle Mayor 1",
        "city": "Madrid",
        "province": "Madrid",
        "postal_code": "28001",
    },
    "phone": "600000001",
    "email": "acme@example.com",
}


async def test_create_client_success(sales_manager_client: AsyncClient):
    response = await sales_manager_client.post("/api/v1/clients", json=VALID_PAYLOAD)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Acme Corp"
    assert data["tax_id"] == "12345678A"
    assert "client_id" in data


async def test_create_client_tax_id_normalized_to_uppercase(
    sales_manager_client: AsyncClient,
):
    payload = {**VALID_PAYLOAD, "tax_id": "12345678a"}
    response = await sales_manager_client.post("/api/v1/clients", json=payload)
    assert response.status_code == 201
    assert response.json()["tax_id"] == "12345678A"


async def test_create_client_invalid_tax_id(sales_manager_client: AsyncClient):
    payload = {**VALID_PAYLOAD, "tax_id": "INVALID"}
    response = await sales_manager_client.post("/api/v1/clients", json=payload)
    assert response.status_code == 422
    assert response.json()["error_code"] == 4103


async def test_create_client_duplicate_tax_id(
    sales_manager_client: AsyncClient, db_session: AsyncSession
):
    db_session.add(
        Client(
            name="Existing Corp",
            tax_id="12345678A",
            street="Calle Mayor 1",
            city="Madrid",
            province="Madrid",
            postal_code="28001",
            phone="600000001",
            email="existing@example.com",
        )
    )
    await db_session.flush()

    response = await sales_manager_client.post("/api/v1/clients", json=VALID_PAYLOAD)
    assert response.status_code == 409
    assert response.json()["error_code"] == 4102


async def test_create_client_duplicate_email(
    sales_manager_client: AsyncClient, db_session: AsyncSession
):
    db_session.add(
        Client(
            name="Existing Corp",
            tax_id="87654321B",
            street="Calle Mayor 1",
            city="Madrid",
            province="Madrid",
            postal_code="28001",
            phone="600000001",
            email="existing@example.com",
        )
    )
    await db_session.flush()

    payload = {**VALID_PAYLOAD, "tax_id": "12345678A", "email": "existing@example.com"}
    response = await sales_manager_client.post("/api/v1/clients", json=payload)
    assert response.status_code == 409
    assert response.json()["error_code"] == 4104


async def test_create_client_invalid_email_format(sales_manager_client: AsyncClient):
    payload = {**VALID_PAYLOAD, "email": "invalid-email"}
    response = await sales_manager_client.post("/api/v1/clients", json=payload)
    assert response.status_code == 422


async def test_create_client_invalid_postal_code_format(
    sales_manager_client: AsyncClient,
):
    payload = {
        **VALID_PAYLOAD,
        "address": {**VALID_PAYLOAD["address"], "postal_code": "2800"},
    }
    response = await sales_manager_client.post("/api/v1/clients", json=payload)
    assert response.status_code == 422


async def test_create_client_invalid_phone_format(sales_manager_client: AsyncClient):
    payload = {**VALID_PAYLOAD, "phone": "abc"}
    response = await sales_manager_client.post("/api/v1/clients", json=payload)
    assert response.status_code == 422


async def test_create_client_missing_required_fields(sales_manager_client: AsyncClient):
    response = await sales_manager_client.post(
        "/api/v1/clients", json={"name": "Incomplete"}
    )
    assert response.status_code == 422


async def test_create_client_unauthenticated(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.post("/api/v1/clients", json=VALID_PAYLOAD)
    assert response.status_code == 401


async def test_create_client_forbidden(non_sales_client: AsyncClient):
    response = await non_sales_client.post("/api/v1/clients", json=VALID_PAYLOAD)
    assert response.status_code == 403

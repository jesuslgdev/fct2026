from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.clients.domain.entities.client import Client


async def _seed_client(db_session: AsyncSession, *, is_active: bool = True) -> Client:
    """Insert a client and return the flushed ORM instance."""
    client = Client(
        name="Toggle Corp",
        tax_id="12345678A",
        address="Calle Mayor 1",
        city="Madrid",
        province="Madrid",
        postal_code="28001",
        phone="600000001",
        email="toggle@example.com",
        is_active=is_active,
    )
    db_session.add(client)
    await db_session.flush()
    return client


async def test_set_client_inactive(
    sales_manager_client: AsyncClient, db_session: AsyncSession
):
    client = await _seed_client(db_session, is_active=True)
    response = await sales_manager_client.patch(
        f"/api/v1/clients/{client.client_id}/active", json={"is_active": False}
    )
    assert response.status_code == 204


async def test_set_client_active_and_verify(
    sales_manager_client: AsyncClient,
    db_session: AsyncSession,
):
    client = await _seed_client(db_session, is_active=False)

    response = await sales_manager_client.patch(
        f"/api/v1/clients/{client.client_id}/active", json={"is_active": True}
    )
    assert response.status_code == 204

    verify = await sales_manager_client.get(f"/api/v1/clients/{client.client_id}")
    assert verify.status_code == 200
    assert verify.json()["is_active"] is True


async def test_set_client_active_not_found(sales_manager_client: AsyncClient):
    response = await sales_manager_client.patch(
        "/api/v1/clients/99999/active", json={"is_active": False}
    )
    assert response.status_code == 404
    assert response.json()["error_code"] == 4101


async def test_set_client_active_unauthenticated(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.patch(
        "/api/v1/clients/1/active", json={"is_active": False}
    )
    assert response.status_code == 401


async def test_set_client_active_forbidden(
    non_sales_client: AsyncClient, db_session: AsyncSession
):
    client = await _seed_client(db_session)
    response = await non_sales_client.patch(
        f"/api/v1/clients/{client.client_id}/active", json={"is_active": False}
    )
    assert response.status_code == 403

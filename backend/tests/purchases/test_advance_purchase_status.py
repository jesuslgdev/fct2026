from unittest.mock import AsyncMock, MagicMock

from httpx import AsyncClient

from composition.dependencies import get_advance_purchase_status_use_case
from composition.security import require_purchases_department_or_admin
from main import app
from modules.purchases.domain.exceptions import PurchaseException, PurchaseExceptionInfo
from shared.domain.dtos.user_session import UserSession
from tests.purchases.conftest import make_purchase


def _purchases_user():
    return UserSession(
        user_id=1,
        email="test@test.com",
        role="Employee",
        department_id=5,
        firebase_uid="test-uid",
        name="Test User",
        last_login_at=None,
    )


async def test_advance_to_approved_returns_200(auth_client: AsyncClient):
    purchase = make_purchase(status="Approved")
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=purchase)
    app.dependency_overrides[get_advance_purchase_status_use_case] = lambda: mock
    app.dependency_overrides[require_purchases_department_or_admin] = _purchases_user
    response = await auth_client.patch(
        "/api/v1/purchases/1/status", json={"status": "Approved"}
    )
    del app.dependency_overrides[get_advance_purchase_status_use_case]
    del app.dependency_overrides[require_purchases_department_or_admin]
    assert response.status_code == 200
    assert response.json()["purchase_id"] == 1
    assert set(response.json()["allowed_transitions"]) == {"Cancelled", "In Process"}


async def test_advance_to_in_process_returns_200(auth_client: AsyncClient):
    purchase = make_purchase(status="In Process")
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=purchase)
    app.dependency_overrides[get_advance_purchase_status_use_case] = lambda: mock
    app.dependency_overrides[require_purchases_department_or_admin] = _purchases_user
    response = await auth_client.patch(
        "/api/v1/purchases/1/status", json={"status": "In Process"}
    )
    del app.dependency_overrides[get_advance_purchase_status_use_case]
    del app.dependency_overrides[require_purchases_department_or_admin]
    assert response.status_code == 200
    assert response.json()["allowed_transitions"] == ["Sent"]


async def test_advance_to_sent_returns_200(auth_client: AsyncClient):
    purchase = make_purchase(status="Sent")
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=purchase)
    app.dependency_overrides[get_advance_purchase_status_use_case] = lambda: mock
    app.dependency_overrides[require_purchases_department_or_admin] = _purchases_user
    response = await auth_client.patch(
        "/api/v1/purchases/1/status", json={"status": "Sent"}
    )
    del app.dependency_overrides[get_advance_purchase_status_use_case]
    del app.dependency_overrides[require_purchases_department_or_admin]
    assert response.status_code == 200
    assert response.json()["allowed_transitions"] == ["Received"]


async def test_advance_to_received_returns_200(auth_client: AsyncClient):
    purchase = make_purchase(status="Received")
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=purchase)
    app.dependency_overrides[get_advance_purchase_status_use_case] = lambda: mock
    app.dependency_overrides[require_purchases_department_or_admin] = _purchases_user
    response = await auth_client.patch(
        "/api/v1/purchases/1/status", json={"status": "Received"}
    )
    del app.dependency_overrides[get_advance_purchase_status_use_case]
    del app.dependency_overrides[require_purchases_department_or_admin]
    assert response.status_code == 200
    assert response.json()["allowed_transitions"] == []


async def test_advance_status_purchase_not_found(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        side_effect=PurchaseException(PurchaseExceptionInfo.PURCHASE_NOT_FOUND)
    )
    app.dependency_overrides[get_advance_purchase_status_use_case] = lambda: mock
    app.dependency_overrides[require_purchases_department_or_admin] = _purchases_user
    response = await auth_client.patch(
        "/api/v1/purchases/999/status", json={"status": "Approved"}
    )
    del app.dependency_overrides[get_advance_purchase_status_use_case]
    del app.dependency_overrides[require_purchases_department_or_admin]
    assert response.status_code == 404


async def test_advance_status_invalid_transition(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        side_effect=PurchaseException(PurchaseExceptionInfo.PURCHASE_INVALID_TRANSITION)
    )
    app.dependency_overrides[get_advance_purchase_status_use_case] = lambda: mock
    app.dependency_overrides[require_purchases_department_or_admin] = _purchases_user
    response = await auth_client.patch(
        "/api/v1/purchases/1/status", json={"status": "Approved"}
    )
    del app.dependency_overrides[get_advance_purchase_status_use_case]
    del app.dependency_overrides[require_purchases_department_or_admin]
    assert response.status_code == 400


async def test_advance_status_passes_actor_to_use_case(auth_client: AsyncClient):
    purchase = make_purchase(status="Approved")
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=purchase)
    app.dependency_overrides[get_advance_purchase_status_use_case] = lambda: mock
    app.dependency_overrides[require_purchases_department_or_admin] = _purchases_user
    await auth_client.patch("/api/v1/purchases/1/status", json={"status": "Approved"})
    del app.dependency_overrides[get_advance_purchase_status_use_case]
    del app.dependency_overrides[require_purchases_department_or_admin]
    mock.execute.assert_called_once_with(
        purchase_id=1,
        new_status="Approved",
        actor=_purchases_user(),
    )


async def test_advance_status_invalid_body_returns_422(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=make_purchase())
    app.dependency_overrides[get_advance_purchase_status_use_case] = lambda: mock
    app.dependency_overrides[require_purchases_department_or_admin] = _purchases_user
    response = await auth_client.patch(
        "/api/v1/purchases/1/status", json={"status": "Unknown"}
    )
    del app.dependency_overrides[get_advance_purchase_status_use_case]
    del app.dependency_overrides[require_purchases_department_or_admin]
    assert response.status_code == 422


async def test_advance_status_unauthenticated(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.patch(
        "/api/v1/purchases/1/status", json={"status": "Approved"}
    )
    assert response.status_code == 401

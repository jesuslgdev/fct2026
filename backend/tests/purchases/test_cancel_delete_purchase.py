from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

from httpx import AsyncClient

from composition.dependencies import (
    get_cancel_purchase_use_case,
    get_delete_purchase_use_case,
)
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


# ── Cancel ──────────────────────────────────────────────────────


async def test_cancel_purchase_returns_200(auth_client: AsyncClient):
    purchase = make_purchase(status="Pending")
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=purchase)
    app.dependency_overrides[get_cancel_purchase_use_case] = lambda: mock
    app.dependency_overrides[require_purchases_department_or_admin] = _purchases_user
    response = await auth_client.patch("/api/v1/purchases/1/cancel")
    del app.dependency_overrides[get_cancel_purchase_use_case]
    del app.dependency_overrides[require_purchases_department_or_admin]
    assert response.status_code == 200
    assert response.json()["purchase_id"] == 1


async def test_cancel_purchase_approved_returns_200(auth_client: AsyncClient):
    purchase = make_purchase(status="Approved")
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=purchase)
    app.dependency_overrides[get_cancel_purchase_use_case] = lambda: mock
    app.dependency_overrides[require_purchases_department_or_admin] = _purchases_user
    response = await auth_client.patch("/api/v1/purchases/1/cancel")
    del app.dependency_overrides[get_cancel_purchase_use_case]
    del app.dependency_overrides[require_purchases_department_or_admin]
    assert response.status_code == 200


async def test_cancel_purchase_not_found(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        side_effect=PurchaseException(PurchaseExceptionInfo.PURCHASE_NOT_FOUND)
    )
    app.dependency_overrides[get_cancel_purchase_use_case] = lambda: mock
    app.dependency_overrides[require_purchases_department_or_admin] = _purchases_user
    response = await auth_client.patch("/api/v1/purchases/999/cancel")
    del app.dependency_overrides[get_cancel_purchase_use_case]
    del app.dependency_overrides[require_purchases_department_or_admin]
    assert response.status_code == 404


async def test_cancel_purchase_not_cancellable(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        side_effect=PurchaseException(PurchaseExceptionInfo.PURCHASE_NOT_CANCELLABLE)
    )
    app.dependency_overrides[get_cancel_purchase_use_case] = lambda: mock
    app.dependency_overrides[require_purchases_department_or_admin] = _purchases_user
    response = await auth_client.patch("/api/v1/purchases/1/cancel")
    del app.dependency_overrides[get_cancel_purchase_use_case]
    del app.dependency_overrides[require_purchases_department_or_admin]
    assert response.status_code == 400


async def test_cancel_purchase_passes_user_id_to_use_case(auth_client: AsyncClient):
    purchase = make_purchase(status="Cancelled")
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=purchase)
    app.dependency_overrides[get_cancel_purchase_use_case] = lambda: mock
    app.dependency_overrides[require_purchases_department_or_admin] = _purchases_user
    await auth_client.patch("/api/v1/purchases/1/cancel")
    del app.dependency_overrides[get_cancel_purchase_use_case]
    del app.dependency_overrides[require_purchases_department_or_admin]
    mock.execute.assert_called_once_with(purchase_id=1, user_id=1)


async def test_cancel_purchase_response_includes_audit_fields(auth_client: AsyncClient):
    cancelled_at = datetime(2026, 4, 6, 12, 0, 0, tzinfo=UTC)
    purchase = make_purchase(
        status="Cancelled",
        cancelled_at=cancelled_at,
        cancelled_by_user_id=1,
    )
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=purchase)
    app.dependency_overrides[get_cancel_purchase_use_case] = lambda: mock
    app.dependency_overrides[require_purchases_department_or_admin] = _purchases_user
    response = await auth_client.patch("/api/v1/purchases/1/cancel")
    del app.dependency_overrides[get_cancel_purchase_use_case]
    del app.dependency_overrides[require_purchases_department_or_admin]
    assert response.status_code == 200
    body = response.json()
    assert body["cancelled_by_user_id"] == 1
    assert body["cancelled_at"] is not None


async def test_cancel_purchase_unauthenticated(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.patch("/api/v1/purchases/1/cancel")
    assert response.status_code == 401


# ── Delete ──────────────────────────────────────────────────────


async def test_delete_purchase_returns_204(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=None)
    app.dependency_overrides[get_delete_purchase_use_case] = lambda: mock
    app.dependency_overrides[require_purchases_department_or_admin] = _purchases_user
    response = await auth_client.delete("/api/v1/purchases/1")
    del app.dependency_overrides[get_delete_purchase_use_case]
    del app.dependency_overrides[require_purchases_department_or_admin]
    assert response.status_code == 204


async def test_delete_purchase_not_found(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        side_effect=PurchaseException(PurchaseExceptionInfo.PURCHASE_NOT_FOUND)
    )
    app.dependency_overrides[get_delete_purchase_use_case] = lambda: mock
    app.dependency_overrides[require_purchases_department_or_admin] = _purchases_user
    response = await auth_client.delete("/api/v1/purchases/999")
    del app.dependency_overrides[get_delete_purchase_use_case]
    del app.dependency_overrides[require_purchases_department_or_admin]
    assert response.status_code == 404


async def test_delete_purchase_not_deletable(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        side_effect=PurchaseException(PurchaseExceptionInfo.PURCHASE_NOT_DELETABLE)
    )
    app.dependency_overrides[get_delete_purchase_use_case] = lambda: mock
    app.dependency_overrides[require_purchases_department_or_admin] = _purchases_user
    response = await auth_client.delete("/api/v1/purchases/1")
    del app.dependency_overrides[get_delete_purchase_use_case]
    del app.dependency_overrides[require_purchases_department_or_admin]
    assert response.status_code == 400


async def test_delete_purchase_unauthenticated(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.delete("/api/v1/purchases/1")
    assert response.status_code == 401

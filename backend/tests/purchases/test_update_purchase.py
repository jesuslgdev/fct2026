from unittest.mock import AsyncMock, MagicMock

from httpx import AsyncClient

from composition.dependencies import get_update_purchase_use_case
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


async def test_update_purchase_returns_200(auth_client: AsyncClient):
    purchase = make_purchase()
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=purchase)
    app.dependency_overrides[get_update_purchase_use_case] = lambda: mock
    app.dependency_overrides[require_purchases_department_or_admin] = _purchases_user
    response = await auth_client.put(
        "/api/v1/purchases/1", json={"supplier_id": 5, "warehouse_id": 2}
    )
    del app.dependency_overrides[get_update_purchase_use_case]
    del app.dependency_overrides[require_purchases_department_or_admin]
    assert response.status_code == 200
    body = response.json()
    assert body["purchase_id"] == 1
    assert body["status"] == "Pending"
    assert len(body["lines"]) == 1


async def test_update_purchase_supplier_changed_returns_empty_lines(
    auth_client: AsyncClient,
):
    purchase = make_purchase(lines=[])
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=purchase)
    app.dependency_overrides[get_update_purchase_use_case] = lambda: mock
    app.dependency_overrides[require_purchases_department_or_admin] = _purchases_user
    response = await auth_client.put(
        "/api/v1/purchases/1", json={"supplier_id": 99, "warehouse_id": 2}
    )
    del app.dependency_overrides[get_update_purchase_use_case]
    del app.dependency_overrides[require_purchases_department_or_admin]
    assert response.status_code == 200
    assert response.json()["lines"] == []


async def test_update_purchase_not_found(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        side_effect=PurchaseException(PurchaseExceptionInfo.PURCHASE_NOT_FOUND)
    )
    app.dependency_overrides[get_update_purchase_use_case] = lambda: mock
    app.dependency_overrides[require_purchases_department_or_admin] = _purchases_user
    response = await auth_client.put(
        "/api/v1/purchases/999", json={"supplier_id": 5, "warehouse_id": 2}
    )
    del app.dependency_overrides[get_update_purchase_use_case]
    del app.dependency_overrides[require_purchases_department_or_admin]
    assert response.status_code == 404


async def test_update_purchase_not_pending(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        side_effect=PurchaseException(PurchaseExceptionInfo.PURCHASE_NOT_PENDING)
    )
    app.dependency_overrides[get_update_purchase_use_case] = lambda: mock
    app.dependency_overrides[require_purchases_department_or_admin] = _purchases_user
    response = await auth_client.put(
        "/api/v1/purchases/1", json={"supplier_id": 5, "warehouse_id": 2}
    )
    del app.dependency_overrides[get_update_purchase_use_case]
    del app.dependency_overrides[require_purchases_department_or_admin]
    assert response.status_code == 400


async def test_update_purchase_supplier_not_found(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        side_effect=PurchaseException(PurchaseExceptionInfo.SUPPLIER_NOT_FOUND)
    )
    app.dependency_overrides[get_update_purchase_use_case] = lambda: mock
    app.dependency_overrides[require_purchases_department_or_admin] = _purchases_user
    response = await auth_client.put(
        "/api/v1/purchases/1", json={"supplier_id": 999, "warehouse_id": 2}
    )
    del app.dependency_overrides[get_update_purchase_use_case]
    del app.dependency_overrides[require_purchases_department_or_admin]
    assert response.status_code == 404


async def test_update_purchase_supplier_not_active(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        side_effect=PurchaseException(PurchaseExceptionInfo.SUPPLIER_NOT_ACTIVE)
    )
    app.dependency_overrides[get_update_purchase_use_case] = lambda: mock
    app.dependency_overrides[require_purchases_department_or_admin] = _purchases_user
    response = await auth_client.put(
        "/api/v1/purchases/1", json={"supplier_id": 5, "warehouse_id": 2}
    )
    del app.dependency_overrides[get_update_purchase_use_case]
    del app.dependency_overrides[require_purchases_department_or_admin]
    assert response.status_code == 400


async def test_update_purchase_unauthenticated(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.put(
        "/api/v1/purchases/1", json={"supplier_id": 5, "warehouse_id": 2}
    )
    assert response.status_code == 401

from unittest.mock import AsyncMock, MagicMock

import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from composition.dependencies import (
    get_get_supplier_use_case,
    get_list_suppliers_use_case,
    get_set_supplier_active_use_case,
    get_update_supplier_use_case,
)
from composition.security import get_current_user, require_purchases_manager_or_admin
from main import app
from modules.suppliers.domain.entities.supplier import Supplier
from shared.domain.entities.user_session import UserSession
from shared.domain.paginated_result import PaginatedResult


def _mock_user(role: str = "Administrator"):
    def override():
        return UserSession(
            user_id=1,
            email="test@test.com",
            role=role,
            department_id=None,
            firebase_uid="test-uid",
            name="Test User",
        )

    return override


def _mock_purchases_auth():
    def override():
        return UserSession(
            user_id=1,
            email="test@test.com",
            role="Administrator",
            department_id=None,
            firebase_uid="test-uid",
            name="Test User",
        )

    return override


def _make_supplier(**kwargs) -> Supplier:
    defaults = {
        "supplier_id": 1,
        "name": "Proveedor Test S.L.",
        "tax_id": "B12345674",
        "address": "Calle Mayor 1",
        "city": "Madrid",
        "province": "Madrid",
        "postal_code": "28001",
        "phone": "910000000",
        "email": "test@test.com",
        "is_active": True,
    }
    defaults.update(kwargs)
    s = MagicMock(spec=Supplier)
    for k, v in defaults.items():
        setattr(s, k, v)
    return s


@pytest_asyncio.fixture
async def auth_client():
    app.dependency_overrides[get_current_user] = _mock_user()
    app.dependency_overrides[require_purchases_manager_or_admin] = (
        _mock_purchases_auth()
    )
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    del app.dependency_overrides[get_current_user]
    del app.dependency_overrides[require_purchases_manager_or_admin]


async def test_list_suppliers_returns_paginated(auth_client: AsyncClient):
    supplier = _make_supplier()
    mock = MagicMock()
    mock.execute = AsyncMock(
        return_value=PaginatedResult(items=[supplier], total=1, page=1, page_size=20)
    )
    app.dependency_overrides[get_list_suppliers_use_case] = lambda: mock
    response = await auth_client.get("/api/v1/suppliers")
    del app.dependency_overrides[get_list_suppliers_use_case]
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert len(body["items"]) == 1
    assert body["items"][0]["supplier_id"] == 1


async def test_list_suppliers_pagination_params(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        return_value=PaginatedResult(items=[], total=0, page=2, page_size=5)
    )
    app.dependency_overrides[get_list_suppliers_use_case] = lambda: mock
    response = await auth_client.get("/api/v1/suppliers?page=2&page_size=5")
    del app.dependency_overrides[get_list_suppliers_use_case]
    assert response.status_code == 200
    mock.execute.assert_called_once_with(2, 5, search=None, active=None)


async def test_get_supplier_returns_detail(auth_client: AsyncClient):
    supplier = _make_supplier()
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=(supplier, []))
    app.dependency_overrides[get_get_supplier_use_case] = lambda: mock
    response = await auth_client.get("/api/v1/suppliers/1")
    del app.dependency_overrides[get_get_supplier_use_case]
    assert response.status_code == 200
    body = response.json()
    assert body["supplier_id"] == 1
    assert body["tax_id"] == "B12345674"
    assert "products" in body


async def test_update_supplier_returns_dto(auth_client: AsyncClient):
    supplier = _make_supplier(name="Nuevo Nombre")
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=supplier)
    app.dependency_overrides[get_update_supplier_use_case] = lambda: mock
    response = await auth_client.put(
        "/api/v1/suppliers/1",
        json={"name": "Nuevo Nombre"},
    )
    del app.dependency_overrides[get_update_supplier_use_case]
    assert response.status_code == 200
    assert response.json()["name"] == "Nuevo Nombre"


async def test_set_supplier_active_returns_204(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=None)
    app.dependency_overrides[get_set_supplier_active_use_case] = lambda: mock
    response = await auth_client.patch(
        "/api/v1/suppliers/1/active",
        json={"is_active": False},
    )
    del app.dependency_overrides[get_set_supplier_active_use_case]
    assert response.status_code == 204


async def test_list_suppliers_unauthenticated(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.get("/api/v1/suppliers")
    assert response.status_code == 401


async def test_update_supplier_unauthenticated(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.put(
        "/api/v1/suppliers/1", json={"name": "X"}
    )
    assert response.status_code == 401

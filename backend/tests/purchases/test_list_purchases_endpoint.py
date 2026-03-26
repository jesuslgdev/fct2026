from datetime import UTC, datetime
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from composition.dependencies import get_list_purchases_use_case
from composition.security import get_current_user
from main import app
from modules.purchases.domain.entities.purchase import Purchase
from shared.domain.entities.user_session import UserSession
from shared.domain.paginated_result import PaginatedResult


def _mock_user():
    def override():
        return UserSession(
            email="test@test.com",
            role="Employee",
            department_id=None,
            firebase_uid="test-uid",
            name="Test User",
        )

    return override


def _make_purchase(**kwargs) -> Purchase:
    defaults = {
        "purchase_id": 1,
        "purchase_number": "PO-00001",
        "supplier_id": 10,
        "user_id": 1,
        "warehouse_id": 1,
        "purchase_date": datetime(2026, 1, 15, tzinfo=UTC),
        "status": "Pending",
        "subtotal": Decimal("100.00"),
        "taxes": Decimal("21.00"),
        "total": Decimal("121.00"),
        "created_at": datetime(2026, 1, 15, tzinfo=UTC),
        "updated_at": datetime(2026, 1, 15, tzinfo=UTC),
    }
    defaults.update(kwargs)
    p = MagicMock(spec=Purchase)
    for k, v in defaults.items():
        setattr(p, k, v)
    return p


@pytest_asyncio.fixture
async def auth_client():
    app.dependency_overrides[get_current_user] = _mock_user()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    del app.dependency_overrides[get_current_user]


async def test_list_purchases_empty(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        return_value=PaginatedResult(items=[], total=0, page=1, page_size=20)
    )
    app.dependency_overrides[get_list_purchases_use_case] = lambda: mock
    response = await auth_client.get("/api/v1/purchases")
    del app.dependency_overrides[get_list_purchases_use_case]
    assert response.status_code == 200
    body = response.json()
    assert body["items"] == []
    assert body["total"] == 0
    assert body["page"] == 1
    assert body["page_size"] == 20


async def test_list_purchases_returns_data(auth_client: AsyncClient):
    purchase = _make_purchase()
    row = (purchase, "Proveedor Test S.L.")
    mock = MagicMock()
    mock.execute = AsyncMock(
        return_value=PaginatedResult(items=[row], total=1, page=1, page_size=20)
    )
    app.dependency_overrides[get_list_purchases_use_case] = lambda: mock
    response = await auth_client.get("/api/v1/purchases")
    del app.dependency_overrides[get_list_purchases_use_case]
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert len(body["items"]) == 1
    item = body["items"][0]
    assert item["purchase_id"] == 1
    assert item["purchase_number"] == "PO-00001"
    assert item["supplier_name"] == "Proveedor Test S.L."
    assert item["status"] == "Pending"
    assert item["warehouse_id"] == 1
    assert float(item["total"]) == 121.00


async def test_list_purchases_pagination_params(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        return_value=PaginatedResult(items=[], total=0, page=3, page_size=5)
    )
    app.dependency_overrides[get_list_purchases_use_case] = lambda: mock
    response = await auth_client.get("/api/v1/purchases?page=3&page_size=5")
    del app.dependency_overrides[get_list_purchases_use_case]
    assert response.status_code == 200
    mock.execute.assert_called_once()
    call_kwargs = mock.execute.call_args[1]
    assert call_kwargs["page"] == 3
    assert call_kwargs["page_size"] == 5


async def test_list_purchases_filter_params(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        return_value=PaginatedResult(items=[], total=0, page=1, page_size=20)
    )
    app.dependency_overrides[get_list_purchases_use_case] = lambda: mock
    response = await auth_client.get("/api/v1/purchases?status=Pending&supplier_id=5")
    del app.dependency_overrides[get_list_purchases_use_case]
    assert response.status_code == 200
    call_kwargs = mock.execute.call_args[1]
    assert call_kwargs["status"] == "Pending"
    assert call_kwargs["supplier_id"] == 5


async def test_list_purchases_sort_params(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        return_value=PaginatedResult(items=[], total=0, page=1, page_size=20)
    )
    app.dependency_overrides[get_list_purchases_use_case] = lambda: mock
    response = await auth_client.get(
        "/api/v1/purchases?sort_field=total&sort_order=asc"
    )
    del app.dependency_overrides[get_list_purchases_use_case]
    assert response.status_code == 200
    call_kwargs = mock.execute.call_args[1]
    assert call_kwargs["sort_field"] == "total"
    assert call_kwargs["sort_order"] == "asc"


async def test_list_purchases_date_filters(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        return_value=PaginatedResult(items=[], total=0, page=1, page_size=20)
    )
    app.dependency_overrides[get_list_purchases_use_case] = lambda: mock
    response = await auth_client.get(
        "/api/v1/purchases?date_from=2026-01-01T00:00:00Z&date_to=2026-12-31T23:59:59Z"
    )
    del app.dependency_overrides[get_list_purchases_use_case]
    assert response.status_code == 200
    call_kwargs = mock.execute.call_args[1]
    assert call_kwargs["date_from"] is not None
    assert call_kwargs["date_to"] is not None


async def test_list_purchases_unauthenticated(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.get("/api/v1/purchases")
    assert response.status_code == 401


async def test_list_purchases_default_sort(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        return_value=PaginatedResult(items=[], total=0, page=1, page_size=20)
    )
    app.dependency_overrides[get_list_purchases_use_case] = lambda: mock
    response = await auth_client.get("/api/v1/purchases")
    del app.dependency_overrides[get_list_purchases_use_case]
    assert response.status_code == 200
    call_kwargs = mock.execute.call_args[1]
    assert call_kwargs["sort_field"] == "created_at"
    assert call_kwargs["sort_order"] == "desc"

from unittest.mock import AsyncMock, MagicMock

from httpx import AsyncClient

from composition.dependencies import get_advance_sale_status_use_case
from composition.security import require_sales_department_or_admin
from main import app
from modules.sales.domain.exceptions import SaleException, SaleExceptionInfo
from tests.sales.conftest import _mock_sales_user, make_sale

_STATUS_URL = "/api/v1/sales/{sale_id}/status"


def _patch_url(sale_id: int = 1) -> str:
    return _STATUS_URL.format(sale_id=sale_id)


async def test_advance_to_approved_returns_200(auth_client: AsyncClient):
    sale = make_sale(status="Approved")
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=sale)
    app.dependency_overrides[get_advance_sale_status_use_case] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    response = await auth_client.patch(_patch_url(), json={"new_status": "Approved"})
    del app.dependency_overrides[get_advance_sale_status_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 200
    assert response.json()["status"] == "Approved"
    assert set(response.json()["allowed_transitions"]) == {"Cancelled", "InProcess"}


async def test_advance_to_in_process_returns_200(auth_client: AsyncClient):
    sale = make_sale(status="InProcess")
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=sale)
    app.dependency_overrides[get_advance_sale_status_use_case] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    response = await auth_client.patch(_patch_url(), json={"new_status": "InProcess"})
    del app.dependency_overrides[get_advance_sale_status_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 200
    assert response.json()["allowed_transitions"] == ["Shipped"]


async def test_advance_to_shipped_returns_200(auth_client: AsyncClient):
    sale = make_sale(status="Shipped")
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=sale)
    app.dependency_overrides[get_advance_sale_status_use_case] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    response = await auth_client.patch(_patch_url(), json={"new_status": "Shipped"})
    del app.dependency_overrides[get_advance_sale_status_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 200
    assert response.json()["allowed_transitions"] == ["Delivered"]


async def test_advance_to_delivered_returns_200(auth_client: AsyncClient):
    sale = make_sale(status="Delivered")
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=sale)
    app.dependency_overrides[get_advance_sale_status_use_case] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    response = await auth_client.patch(_patch_url(), json={"new_status": "Delivered"})
    del app.dependency_overrides[get_advance_sale_status_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 200
    assert response.json()["allowed_transitions"] == []


async def test_advance_to_cancelled_from_pending_returns_200(auth_client: AsyncClient):
    sale = make_sale(status="Cancelled")
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=sale)
    app.dependency_overrides[get_advance_sale_status_use_case] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    response = await auth_client.patch(_patch_url(), json={"new_status": "Cancelled"})
    del app.dependency_overrides[get_advance_sale_status_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 200
    assert response.json()["allowed_transitions"] == []


async def test_sale_not_found_returns_404(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        side_effect=SaleException(SaleExceptionInfo.SALE_NOT_FOUND)
    )
    app.dependency_overrides[get_advance_sale_status_use_case] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    response = await auth_client.patch(_patch_url(999), json={"new_status": "Approved"})
    del app.dependency_overrides[get_advance_sale_status_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 404


async def test_invalid_transition_returns_422(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        side_effect=SaleException(SaleExceptionInfo.SALE_INVALID_TRANSITION)
    )
    app.dependency_overrides[get_advance_sale_status_use_case] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    response = await auth_client.patch(_patch_url(), json={"new_status": "Shipped"})
    del app.dependency_overrides[get_advance_sale_status_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 422


async def test_terminal_state_returns_422(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        side_effect=SaleException(SaleExceptionInfo.SALE_TERMINAL_STATE)
    )
    app.dependency_overrides[get_advance_sale_status_use_case] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    response = await auth_client.patch(_patch_url(), json={"new_status": "Approved"})
    del app.dependency_overrides[get_advance_sale_status_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 422


async def test_insufficient_stock_returns_422(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        side_effect=SaleException(SaleExceptionInfo.INSUFFICIENT_STOCK)
    )
    app.dependency_overrides[get_advance_sale_status_use_case] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    response = await auth_client.patch(_patch_url(), json={"new_status": "Approved"})
    del app.dependency_overrides[get_advance_sale_status_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 422


async def test_advance_status_passes_actor_to_use_case(auth_client: AsyncClient):
    sale = make_sale(status="Approved")
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=sale)
    app.dependency_overrides[get_advance_sale_status_use_case] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    await auth_client.patch(_patch_url(), json={"new_status": "Approved"})
    del app.dependency_overrides[get_advance_sale_status_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]
    call_kwargs = mock.execute.call_args.kwargs
    assert call_kwargs["sale_id"] == 1
    assert call_kwargs["new_status"] == "Approved"
    assert call_kwargs["actor"].email == "sales@test.com"


async def test_advance_status_response_includes_status_history(
    auth_client: AsyncClient,
):
    history_entry = MagicMock()
    history_entry.from_status = None
    history_entry.to_status = "Approved"
    history_entry.changed_at = __import__("datetime").datetime(
        2026, 4, 14, tzinfo=__import__("datetime").timezone.utc
    )
    history_entry.changed_by_user_id = 1
    sale = make_sale(status="Approved", status_history=[history_entry])
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=sale)
    app.dependency_overrides[get_advance_sale_status_use_case] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    response = await auth_client.patch(_patch_url(), json={"new_status": "Approved"})
    del app.dependency_overrides[get_advance_sale_status_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 200
    history = response.json()["status_history"]
    assert len(history) == 1
    assert history[0]["to_status"] == "Approved"
    assert history[0]["changed_by_user_id"] == 1

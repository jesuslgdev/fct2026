from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

from fastapi import HTTPException
from httpx import AsyncClient

from composition.dependencies import get_update_sale_use_case
from composition.security import require_sales_department_or_admin
from main import app
from modules.sales.domain.exceptions import SaleException, SaleExceptionInfo
from tests.sales.conftest import _mock_sales_user, make_sale, make_sale_line

VALID_UPDATE_BODY = {
    "client_id": 6,
    "delivery_address": "Avenida de Europa 20, Madrid, Madrid, 28108",
    "lines": [{"product_id": 11, "quantity": 3}],
}


async def test_update_sale_success_pending(auth_client: AsyncClient):
    line = make_sale_line(
        product_id=11,
        quantity=3,
        unit_price=Decimal("30.00"),
        line_subtotal=Decimal("90.00"),
        vat_rate=Decimal("0.21"),
        line_tax=Decimal("18.90"),
    )
    sale = make_sale(
        client_id=6,
        client_name="Cliente Editado S.L.",
        delivery_address=VALID_UPDATE_BODY["delivery_address"],
        subtotal=Decimal("90.00"),
        taxes=Decimal("18.90"),
        total=Decimal("108.90"),
        lines=[line],
    )
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=sale)
    app.dependency_overrides[get_update_sale_use_case] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    response = await auth_client.put("/api/v1/sales/1", json=VALID_UPDATE_BODY)
    del app.dependency_overrides[get_update_sale_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]

    assert response.status_code == 200
    body = response.json()
    assert body["sale_id"] == 1
    assert body["status"] == "Pending"
    assert body["client_id"] == 6
    assert body["delivery_address"] == VALID_UPDATE_BODY["delivery_address"]
    assert float(body["subtotal"]) == 90.00
    assert float(body["taxes"]) == 18.90
    assert float(body["total"]) == 108.90
    assert body["lines"][0]["product_id"] == 11
    assert body["lines"][0]["quantity"] == 3


async def test_update_sale_not_pending_error(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(
        side_effect=SaleException(SaleExceptionInfo.SALE_NOT_PENDING)
    )
    app.dependency_overrides[get_update_sale_use_case] = lambda: mock
    app.dependency_overrides[require_sales_department_or_admin] = _mock_sales_user
    response = await auth_client.put("/api/v1/sales/1", json=VALID_UPDATE_BODY)
    del app.dependency_overrides[get_update_sale_use_case]
    del app.dependency_overrides[require_sales_department_or_admin]

    assert response.status_code == 400
    body = response.json()
    assert body["error_code"] == SaleExceptionInfo.SALE_NOT_PENDING.code
    assert body["detail"] == SaleExceptionInfo.SALE_NOT_PENDING.message


async def test_update_sale_forbidden_for_non_sales(auth_client: AsyncClient):
    def override_forbidden():
        raise HTTPException(status_code=403, detail="Forbidden")

    app.dependency_overrides[require_sales_department_or_admin] = override_forbidden
    response = await auth_client.put("/api/v1/sales/1", json=VALID_UPDATE_BODY)
    del app.dependency_overrides[require_sales_department_or_admin]
    assert response.status_code == 403


async def test_update_sale_unauthenticated(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.put(
        "/api/v1/sales/1", json=VALID_UPDATE_BODY
    )
    assert response.status_code == 401

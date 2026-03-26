from datetime import UTC, datetime
from decimal import Decimal
from unittest.mock import MagicMock

import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from composition.security import get_current_user
from main import app
from modules.purchases.domain.entities.purchase import Purchase
from modules.purchases.domain.entities.purchase_enriched import PurchaseEnriched
from modules.purchases.domain.entities.purchase_line import PurchaseLine
from shared.domain.dtos.user_session import UserSession


def _mock_user():
    def override():
        return UserSession(
            user_id=1,
            email="test@test.com",
            role="Employee",
            department_id=None,
            firebase_uid="test-uid",
            name="Test User",
        )

    return override


def make_purchase_line(**kwargs) -> MagicMock:
    defaults = {
        "purchase_line_id": 1,
        "purchase_id": 1,
        "product_id": 10,
        "quantity": 2,
        "unit_price": Decimal("50.00"),
        "discount": Decimal("0.00"),
        "line_subtotal": Decimal("100.00"),
        "vat_rate": Decimal("0.21"),
        "line_tax": Decimal("21.00"),
    }
    defaults.update(kwargs)
    line = MagicMock(spec=PurchaseLine)
    for k, v in defaults.items():
        setattr(line, k, v)
    return line


def make_purchase(**kwargs) -> MagicMock:
    line = make_purchase_line()
    defaults = {
        "purchase_id": 1,
        "purchase_number": "COM-2026-0001",
        "supplier_id": 5,
        "user_id": 3,
        "warehouse_id": 2,
        "purchase_date": datetime(2026, 1, 15, tzinfo=UTC),
        "status": "Pending",
        "subtotal": Decimal("100.00"),
        "taxes": Decimal("21.00"),
        "total": Decimal("121.00"),
        "created_at": datetime(2026, 1, 15, tzinfo=UTC),
        "updated_at": datetime(2026, 1, 15, tzinfo=UTC),
        "lines": [line],
    }
    defaults.update(kwargs)
    purchase = MagicMock(spec=Purchase)
    for k, v in defaults.items():
        setattr(purchase, k, v)
    return purchase


def make_enriched(purchase: MagicMock | None = None, **kwargs) -> PurchaseEnriched:
    if purchase is None:
        purchase = make_purchase()
    defaults = {
        "purchase": purchase,
        "supplier_name": "Proveedor Test S.L.",
        "user_name": "Juan García",
        "warehouse_name": None,
        "product_names": {10: "Tornillo M8"},
    }
    defaults.update(kwargs)
    return PurchaseEnriched(**defaults)


@pytest_asyncio.fixture
async def auth_client():
    app.dependency_overrides[get_current_user] = _mock_user()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    del app.dependency_overrides[get_current_user]

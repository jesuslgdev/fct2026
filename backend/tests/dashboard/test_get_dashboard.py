from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from composition.security import get_current_user
from main import app
from modules.admin.domain.entities.department import Department
from modules.catalog.domain.entities.category import Category
from modules.catalog.domain.entities.product import Product
from modules.clients.domain.entities.client import Client
from modules.purchases.domain.entities.purchase import Purchase
from modules.sales.domain.entities.sale import Sale
from modules.suppliers.domain.entities.supplier import Supplier
from modules.warehouse.domain.entities.warehouse import Warehouse
from modules.warehouse.domain.entities.warehouse_stock import WarehouseStock
from shared.config import settings
from shared.domain.dtos.address import Address
from shared.domain.dtos.user_session import UserSession
from shared.domain.entities.user import User
from shared.infrastructure.database.connection import get_db


def _month_start(dt: datetime) -> datetime:
    return datetime(dt.year, dt.month, 1, tzinfo=UTC)


def _previous_month_start(dt: datetime) -> datetime:
    if dt.month == 1:
        return datetime(dt.year - 1, 12, 1, tzinfo=UTC)
    return datetime(dt.year, dt.month - 1, 1, tzinfo=UTC)


def _session(role: str, department_id: int | None) -> UserSession:
    return UserSession(
        user_id=100,
        email="viewer@test.com",
        role=role,
        department_id=department_id,
        firebase_uid="viewer-uid",
        name="Viewer User",
        last_login_at=None,
    )


@pytest.fixture
def dashboard_settings():
    original_stale_days = settings.dashboard_stale_days
    original_recent_limit = settings.dashboard_recent_limit
    settings.dashboard_stale_days = 7
    settings.dashboard_recent_limit = 5
    yield
    settings.dashboard_stale_days = original_stale_days
    settings.dashboard_recent_limit = original_recent_limit


@pytest_asyncio.fixture
async def dashboard_client(db_session: AsyncSession, dashboard_settings):
    user_box = {"value": _session(role="Administrator", department_id=None)}

    async def override_get_db():
        yield db_session

    def override_get_current_user():
        return user_box["value"]

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac, user_box

    del app.dependency_overrides[get_db]
    del app.dependency_overrides[get_current_user]


@pytest_asyncio.fixture
async def seeded_dashboard_data(db_session: AsyncSession):
    now = datetime.now(UTC)
    current_month_start = _month_start(now)
    previous_month_start = _previous_month_start(now)

    sales_department = Department(name="Sales")
    purchases_department = Department(name="Purchases")
    db_session.add_all([sales_department, purchases_department])
    await db_session.flush()

    purchases_user = User(
        first_name="Purchase",
        last_name="User",
        email="purchase.dashboard@test.com",
        role="Employee",
        department_id=purchases_department.department_id,
        is_active=True,
    )
    sales_user = User(
        first_name="Sales",
        last_name="User",
        email="sales.dashboard@test.com",
        role="Employee",
        department_id=sales_department.department_id,
        is_active=True,
    )
    db_session.add_all([purchases_user, sales_user])
    await db_session.flush()

    suppliers = [
        Supplier(
            name="Supplier A",
            tax_id="SUPA123",
            address_data=Address("Street 1", "Madrid", "Madrid", "28001"),
            phone="600000001",
            email="supplier.a@test.com",
            is_active=True,
        ),
        Supplier(
            name="Supplier B",
            tax_id="SUPB123",
            address_data=Address("Street 2", "Madrid", "Madrid", "28002"),
            phone="600000002",
            email="supplier.b@test.com",
            is_active=True,
        ),
    ]
    clients = [
        Client(
            name="Client A",
            tax_id="CLIA123",
            address_data=Address("Main 1", "Madrid", "Madrid", "28001"),
            phone="700000001",
            email="client.a@test.com",
            is_active=True,
        ),
        Client(
            name="Client B",
            tax_id="CLIB123",
            address_data=Address("Main 2", "Madrid", "Madrid", "28002"),
            phone="700000002",
            email="client.b@test.com",
            is_active=True,
        ),
    ]
    db_session.add_all(suppliers + clients)
    await db_session.flush()

    category = Category(name="Hardware", description="Hardware category")
    db_session.add(category)
    await db_session.flush()

    warehouse = Warehouse(
        name="Main Warehouse",
        address_data=Address("Warehouse 1", "Madrid", "Madrid", "28001"),
    )
    db_session.add(warehouse)
    await db_session.flush()

    products: list[tuple[Product, int]] = []
    for code, name, stock_current, stock_min in [
        ("LOW-001", "Low Product 1", 3, 10),
        ("LOW-002", "Low Product 2", 0, 5),
        ("OK-001", "Healthy Product", 20, 5),
    ]:
        product = Product(
            product_code=code,
            name=name,
            description="",
            category_id=category.category_id,
            price=Decimal("10.00"),
            vat_rate=Decimal("0.21"),
            stock_min=stock_min,
            is_active=True,
        )
        db_session.add(product)
        products.append((product, stock_current))

    await db_session.flush()

    for product, stock_current in products:
        db_session.add(
            WarehouseStock(
                warehouse_id=warehouse.warehouse_id,
                product_id=product.product_id,
                stock=stock_current,
                reserved_stock=0,
            )
        )

    purchase_specs = [
        ("COM-2026-9001", 0, "Received", "121.00", 1, 1),
        ("COM-2026-9002", 1, "Received", "60.50", 2, 10),
        ("COM-2026-9003", 0, "Pending", "36.30", 3, 8),
        ("COM-2026-9004", 1, "Approved", "48.40", 4, 2),
        ("COM-2026-9005", 0, "Pending", "24.20", 5, 9),
        ("COM-2026-9006", 1, "Cancelled", "12.10", 6, 20),
    ]
    for idx, (number, supplier_idx, status, total, hours_old, stale_days) in enumerate(
        purchase_specs, start=1
    ):
        purchase_date = (
            current_month_start + timedelta(days=idx)
            if idx != 2
            else previous_month_start + timedelta(days=2)
        )
        db_session.add(
            Purchase(
                purchase_number=number,
                supplier_id=suppliers[supplier_idx].supplier_id,
                user_id=purchases_user.user_id,
                warehouse_id=warehouse.warehouse_id,
                purchase_date=purchase_date,
                status=status,
                status_changed_at=now - timedelta(days=stale_days),
                subtotal=Decimal(total),
                taxes=Decimal("0.00"),
                total=Decimal(total),
                created_at=now - timedelta(hours=hours_old),
                updated_at=now - timedelta(hours=hours_old),
            )
        )

    sales_specs = [
        ("VEN-2026-9001", 0, "Pending", "96.80", 1, 1),
        ("VEN-2026-9002", 1, "Approved", "60.50", 2, 10),
        ("VEN-2026-9003", 0, "In Process", "48.40", 3, 8),
        ("VEN-2026-9004", 1, "Pending", "36.30", 4, 2),
        ("VEN-2026-9005", 0, "Approved", "24.20", 5, 12),
        ("VEN-2026-9006", 1, "Cancelled", "12.10", 6, 25),
    ]
    for idx, (number, client_idx, status, total, hours_old, stale_days) in enumerate(
        sales_specs, start=1
    ):
        db_session.add(
            Sale(
                sale_number=number,
                client_id=clients[client_idx].client_id,
                delivery_address=f"Address {idx}",
                user_id=sales_user.user_id,
                sale_date=current_month_start + timedelta(days=idx),
                status=status,
                status_changed_at=now - timedelta(days=stale_days),
                subtotal=Decimal(total),
                taxes=Decimal("0.00"),
                total=Decimal(total),
                created_at=now - timedelta(hours=hours_old),
                updated_at=now - timedelta(hours=hours_old),
            )
        )

    await db_session.flush()

    return {
        "sales_department_id": sales_department.department_id,
        "purchases_department_id": purchases_department.department_id,
    }


def _status_map(items: list[dict]) -> dict[str, int]:
    return {item["status"]: item["count"] for item in items}


@pytest.mark.asyncio
async def test_dashboard_admin_returns_full_payload(
    dashboard_client, seeded_dashboard_data
):
    client, user_box = dashboard_client
    user_box["value"] = _session(role="Administrator", department_id=None)

    response = await client.get("/api/v1/dashboard")
    assert response.status_code == 200
    body = response.json()

    assert body["meta"] == {
        "generated_at": body["meta"]["generated_at"],
        "stale_days": 7,
        "recent_limit": 5,
    }

    purchase_summary = _status_map(body["purchase_status_summary"])
    assert purchase_summary == {
        "Approved": 1,
        "Cancelled": 1,
        "Pending": 2,
        "Received": 2,
    }

    sales_summary = _status_map(body["sales_status_summary"])
    assert sales_summary == {
        "Approved": 2,
        "Cancelled": 1,
        "In Process": 1,
        "Pending": 2,
    }

    assert [x["number"] for x in body["latest_purchases"][:2]] == [
        "COM-2026-9001",
        "COM-2026-9002",
    ]
    assert [x["number"] for x in body["latest_sales"][:2]] == [
        "VEN-2026-9001",
        "VEN-2026-9002",
    ]

    spend = body["purchase_spend_comparison"]
    assert float(spend["current_month"]) == 121.0
    assert float(spend["previous_month"]) == 60.5
    assert float(spend["difference_amount"]) == 60.5
    assert float(spend["difference_percent"]) == 100.0

    assert {x["product_code"] for x in body["low_stock_products"]} == {
        "LOW-001",
        "LOW-002",
    }
    assert all(x["days_in_status"] >= 7 for x in body["stale_purchases"])
    assert all(x["days_in_status"] >= 7 for x in body["stale_sales"])


@pytest.mark.asyncio
async def test_dashboard_purchases_department_visibility(
    dashboard_client, seeded_dashboard_data
):
    client, user_box = dashboard_client
    user_box["value"] = _session(
        role="Employee",
        department_id=seeded_dashboard_data["purchases_department_id"],
    )

    response = await client.get("/api/v1/dashboard")
    assert response.status_code == 200
    body = response.json()

    assert body["purchase_status_summary"]
    assert body["latest_purchases"]
    assert body["stale_purchases"]
    assert body["purchase_spend_comparison"] is not None
    assert body["sales_status_summary"] == []
    assert body["latest_sales"] == []
    assert body["stale_sales"] == []
    assert body["low_stock_products"]


@pytest.mark.asyncio
async def test_dashboard_sales_department_visibility(
    dashboard_client, seeded_dashboard_data
):
    client, user_box = dashboard_client
    user_box["value"] = _session(
        role="Employee",
        department_id=seeded_dashboard_data["sales_department_id"],
    )

    response = await client.get("/api/v1/dashboard")
    assert response.status_code == 200
    body = response.json()

    assert body["sales_status_summary"]
    assert body["latest_sales"]
    assert body["stale_sales"]
    assert body["purchase_status_summary"] == []
    assert body["latest_purchases"] == []
    assert body["stale_purchases"] == []
    assert body["purchase_spend_comparison"] is None
    assert body["low_stock_products"]


@pytest.mark.asyncio
async def test_dashboard_difference_percent_is_null_when_previous_month_is_zero(
    dashboard_client,
    db_session: AsyncSession,
    seeded_dashboard_data,
):
    client, user_box = dashboard_client
    user_box["value"] = _session(role="Administrator", department_id=None)

    previous_received = await db_session.execute(
        select(Purchase).where(Purchase.purchase_number == "COM-2026-9002")
    )
    purchase = previous_received.scalar_one()
    purchase.status = "Pending"
    purchase.status_changed_at = datetime.now(UTC) - timedelta(days=1)
    await db_session.flush()

    response = await client.get("/api/v1/dashboard")
    assert response.status_code == 200
    spend = response.json()["purchase_spend_comparison"]
    assert float(spend["previous_month"]) == 0.0
    assert spend["difference_percent"] is None


@pytest.mark.asyncio
async def test_dashboard_unauthenticated_returns_401(
    unauthenticated_client: AsyncClient,
):
    response = await unauthenticated_client.get("/api/v1/dashboard")
    assert response.status_code == 401

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from composition.security import get_current_user, require_admin
from main import app
from modules.catalog.domain.entities.category import Category
from modules.catalog.domain.entities.product import Product
from modules.warehouse.domain.entities.warehouse import Warehouse
from modules.warehouse.domain.entities.warehouse_stock import WarehouseStock
from shared.domain.dtos.user_session import UserSession
from shared.infrastructure.database.connection import get_db


@pytest_asyncio.fixture
async def sample_category(db_session: AsyncSession) -> Category:
    """Create a category required as FK for products."""
    category = Category(name="Electronics", description="Gadgets")
    db_session.add(category)
    await db_session.flush()
    return category


@pytest_asyncio.fixture
async def sample_product(
    db_session: AsyncSession, sample_category: Category
) -> Product:
    """Create a product with stock_min=10 for alert testing."""
    product = Product(
        product_code="PROD-001",
        name="Smartphone",
        category_id=sample_category.category_id,
        price=599.99,
        stock_current=0,
        stock_min=10,
    )
    db_session.add(product)
    await db_session.flush()
    return product


@pytest_asyncio.fixture
async def warehouse_a(db_session: AsyncSession) -> Warehouse:
    """Create warehouse A."""
    wh = Warehouse(name="Warehouse A", address="Street 1")
    db_session.add(wh)
    await db_session.flush()
    return wh


@pytest_asyncio.fixture
async def warehouse_b(db_session: AsyncSession) -> Warehouse:
    """Create warehouse B."""
    wh = Warehouse(name="Warehouse B", address="Street 2")
    db_session.add(wh)
    await db_session.flush()
    return wh


@pytest_asyncio.fixture
async def stock_in_two_warehouses(
    db_session: AsyncSession,
    sample_product: Product,
    warehouse_a: Warehouse,
    warehouse_b: Warehouse,
) -> list[WarehouseStock]:
    """Seed stock for a product in two warehouses: 8 + 7 = 15 total."""
    stock_a = WarehouseStock(
        warehouse_id=warehouse_a.warehouse_id,
        product_id=sample_product.product_id,
        stock=8,
        reserved_stock=2,
    )
    stock_b = WarehouseStock(
        warehouse_id=warehouse_b.warehouse_id,
        product_id=sample_product.product_id,
        stock=7,
        reserved_stock=0,
    )
    db_session.add_all([stock_a, stock_b])
    await db_session.flush()
    return [stock_a, stock_b]


@pytest_asyncio.fixture
async def stock_zero_in_warehouse(
    db_session: AsyncSession,
    sample_product: Product,
    warehouse_a: Warehouse,
) -> WarehouseStock:
    """Seed stock=0 for a product in one warehouse."""
    stock = WarehouseStock(
        warehouse_id=warehouse_a.warehouse_id,
        product_id=sample_product.product_id,
        stock=0,
        reserved_stock=0,
    )
    db_session.add(stock)
    await db_session.flush()
    return stock


@pytest_asyncio.fixture
async def stock_below_min(
    db_session: AsyncSession,
    sample_product: Product,
    warehouse_a: Warehouse,
) -> WarehouseStock:
    """Seed stock=5 (below stock_min=10) for warning alert testing."""
    stock = WarehouseStock(
        warehouse_id=warehouse_a.warehouse_id,
        product_id=sample_product.product_id,
        stock=5,
        reserved_stock=0,
    )
    db_session.add(stock)
    await db_session.flush()
    return stock


@pytest_asyncio.fixture
async def admin_client(db_session: AsyncSession):
    """Authenticated client with admin role for write endpoints."""

    async def override_get_db():
        yield db_session

    def override_require_admin():
        return UserSession(
            user_id=1,
            email="admin@test.com",
            role="Administrator",
            department_id=None,
            firebase_uid="test-uid",
            name="Admin Test",
        )

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[require_admin] = override_require_admin
    app.dependency_overrides[get_current_user] = override_require_admin

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    del app.dependency_overrides[get_db]
    del app.dependency_overrides[require_admin]
    del app.dependency_overrides[get_current_user]


@pytest_asyncio.fixture
async def sample_warehouse(db_session: AsyncSession) -> Warehouse:
    """Create a standalone warehouse for management tests."""
    wh = Warehouse(name="Main Warehouse", address="123 Main St")
    db_session.add(wh)
    await db_session.flush()
    return wh


@pytest_asyncio.fixture
async def warehouse_with_stock(
    db_session: AsyncSession,
    sample_product: Product,
) -> Warehouse:
    """Create a warehouse that has stock (cannot be deleted)."""
    wh = Warehouse(name="Stocked Warehouse", address="456 Stock Ave")
    db_session.add(wh)
    await db_session.flush()
    stock = WarehouseStock(
        warehouse_id=wh.warehouse_id,
        product_id=sample_product.product_id,
        stock=10,
        reserved_stock=0,
    )
    db_session.add(stock)
    await db_session.flush()
    return wh


@pytest_asyncio.fixture
async def inactive_product(
    db_session: AsyncSession, sample_category: Category
) -> Product:
    """Create an inactive product for rejection tests."""
    product = Product(
        product_code="PROD-INACTIVE",
        name="Discontinued Item",
        category_id=sample_category.category_id,
        price=9.99,
        stock_current=0,
        stock_min=0,
        is_active=False,
    )
    db_session.add(product)
    await db_session.flush()
    return product


@pytest_asyncio.fixture
async def second_product(
    db_session: AsyncSession, sample_category: Category
) -> Product:
    """Create a second active product for multi-product distribution tests."""
    product = Product(
        product_code="PROD-002",
        name="Tablet",
        category_id=sample_category.category_id,
        price=299.99,
        stock_current=0,
        stock_min=5,
    )
    db_session.add(product)
    await db_session.flush()
    return product


@pytest_asyncio.fixture
async def stock_distribution_seed(
    db_session: AsyncSession,
    sample_product: Product,
    second_product: Product,
    warehouse_a: Warehouse,
    warehouse_b: Warehouse,
) -> list[WarehouseStock]:
    """Seed 3 stock records: sample_product x2 warehouses, second_product x warehouse_a."""
    records = [
        WarehouseStock(
            warehouse_id=warehouse_a.warehouse_id,
            product_id=sample_product.product_id,
            stock=10,
            reserved_stock=2,
        ),
        WarehouseStock(
            warehouse_id=warehouse_b.warehouse_id,
            product_id=sample_product.product_id,
            stock=5,
            reserved_stock=0,
        ),
        WarehouseStock(
            warehouse_id=warehouse_a.warehouse_id,
            product_id=second_product.product_id,
            stock=20,
            reserved_stock=0,
        ),
    ]
    db_session.add_all(records)
    await db_session.flush()
    return records

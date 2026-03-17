import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from modules.catalog.domain.entities.category import Category
from modules.catalog.domain.entities.product import Product
from modules.warehouse.domain.entities.warehouse import Warehouse
from modules.warehouse.domain.entities.warehouse_stock import WarehouseStock


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

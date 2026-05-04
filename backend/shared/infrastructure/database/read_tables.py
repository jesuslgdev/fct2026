from sqlalchemy import Column, DateTime, Integer, MetaData, Numeric, String, Table

# Read-only SQL table references used for cross-module infrastructure queries.
READ_METADATA = MetaData()

products_table = Table(
    "products",
    READ_METADATA,
    Column("product_id", Integer, primary_key=True),
    Column("product_code", String),
    Column("name", String),
    Column("category_id", Integer),
    Column("stock_min", Integer),
)

categories_table = Table(
    "categories",
    READ_METADATA,
    Column("category_id", Integer, primary_key=True),
    Column("name", String),
)

suppliers_table = Table(
    "suppliers",
    READ_METADATA,
    Column("supplier_id", Integer, primary_key=True),
    Column("name", String),
)

clients_table = Table(
    "clients",
    READ_METADATA,
    Column("client_id", Integer, primary_key=True),
    Column("name", String),
)

purchases_table = Table(
    "purchases",
    READ_METADATA,
    Column("purchase_id", Integer, primary_key=True),
    Column("purchase_number", String),
    Column("supplier_id", Integer),
    Column("status", String),
    Column("purchase_date", DateTime(timezone=True)),
    Column("total", Numeric(10, 2)),
    Column("created_at", DateTime(timezone=True)),
    Column("status_changed_at", DateTime(timezone=True)),
)

sales_table = Table(
    "sales",
    READ_METADATA,
    Column("sale_id", Integer, primary_key=True),
    Column("sale_number", String),
    Column("client_id", Integer),
    Column("status", String),
    Column("sale_date", DateTime(timezone=True)),
    Column("total", Numeric(10, 2)),
    Column("created_at", DateTime(timezone=True)),
    Column("status_changed_at", DateTime(timezone=True)),
)

warehouse_stock_table = Table(
    "warehouse_stock",
    READ_METADATA,
    Column("warehouse_stock_id", Integer, primary_key=True),
    Column("warehouse_id", Integer),
    Column("product_id", Integer),
    Column("stock", Integer),
    Column("reserved_stock", Integer),
)

from sqlalchemy import Column, Integer, MetaData, String, Table

# Read-only SQL table references used for cross-module infrastructure queries.
READ_METADATA = MetaData()

products_table = Table(
    "products",
    READ_METADATA,
    Column("product_id", Integer, primary_key=True),
    Column("product_code", String),
    Column("name", String),
    Column("category_id", Integer),
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

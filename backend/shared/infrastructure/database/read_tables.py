from sqlalchemy import Column, Integer, MetaData, String, Table

# Read-only SQL table references used for cross-module infrastructure queries.
READ_METADATA = MetaData()

products_table = Table(
    "products",
    READ_METADATA,
    Column("product_id", Integer, primary_key=True),
    Column("product_code", String),
    Column("name", String),
)

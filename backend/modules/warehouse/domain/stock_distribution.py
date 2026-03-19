from dataclasses import dataclass


@dataclass(frozen=True)
class StockDistributionItem:
    """A single row in the stock distribution grid.

    Attributes:
        warehouse_id: Warehouse primary key.
        warehouse_name: Human-readable warehouse name.
        product_id: Product primary key.
        product_code: Unique SKU.
        product_name: Product display name.
        stock: Total physical units in this warehouse.
        reserved_stock: Units committed by active sales.
        available_stock: Units available for new sales.
    """

    warehouse_id: int
    warehouse_name: str
    product_id: int
    product_code: str
    product_name: str
    stock: int
    reserved_stock: int
    available_stock: int


@dataclass(frozen=True)
class StockDistributionPage:
    """Paginated result for stock distribution queries.

    Attributes:
        items: Stock distribution rows for the current page.
        total_count: Total number of rows matching the filters.
        page: Current page number (1-based).
        page_size: Maximum items per page.
    """

    items: list[StockDistributionItem]
    total_count: int
    page: int
    page_size: int

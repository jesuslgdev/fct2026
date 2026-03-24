from abc import ABC, abstractmethod
from decimal import Decimal

from modules.catalog.domain.entities.product import Product
from shared.domain.paginated_result import PaginatedResult


class IProductRepository(ABC):
    """Contract for product data persistence."""

    @abstractmethod
    async def get_all_paginated(
        self, page: int, page_size: int, category_id: int | None = None
    ) -> PaginatedResult[Product]:
        """Fetch a paginated list of products, optionally filtered by category."""
        ...

    @abstractmethod
    async def get_by_id(self, product_id: int) -> Product | None:
        """Fetch a single product by its database ID."""
        ...

    @abstractmethod
    async def get_by_code(self, product_code: str) -> Product | None:
        """Fetch a single product by its natural code (SKU)."""
        ...

    @abstractmethod
    async def create(
        self,
        product_code: str,
        name: str,
        description: str | None,
        category_id: int,
        price: Decimal,
        stock_current: int,
        stock_min: int,
    ) -> Product:
        """Persist a new product entity."""
        ...

    @abstractmethod
    async def update(
        self,
        product_id: int,
        product_code: str | None = None,
        name: str | None = None,
        description: str | None = None,
        category_id: int | None = None,
        price: Decimal | None = None,
        stock_min: int | None = None,
    ) -> Product:
        """Update existing product fields."""
        ...

    @abstractmethod
    async def set_active(self, product_id: int, is_active: bool) -> None:
        """Perform logical deletion or activation."""
        ...

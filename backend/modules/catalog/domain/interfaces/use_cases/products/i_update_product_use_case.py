from abc import ABC, abstractmethod
from decimal import Decimal

from modules.catalog.domain.entities.product import Product


class IUpdateProductUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        product_id: int,
        product_code: str | None = None,
        name: str | None = None,
        description: str | None = None,
        category_id: int | None = None,
        price: Decimal | None = None,
        vat_rate: Decimal | None = None,
        stock_min: int | None = None,
    ) -> Product:
        """Update an existing product validating partial changes and code collisions."""
        ...

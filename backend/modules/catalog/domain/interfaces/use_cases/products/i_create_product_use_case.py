from abc import ABC, abstractmethod
from decimal import Decimal

from modules.catalog.domain.entities.product import Product


class ICreateProductUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        name: str,
        description: str | None,
        category_id: int,
        price: Decimal,
        vat_rate: Decimal,
        stock_min: int,
    ) -> Product:
        """Create a new product after validating uniqueness and category existence."""
        ...

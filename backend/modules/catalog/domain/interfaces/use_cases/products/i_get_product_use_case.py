from abc import ABC, abstractmethod

from modules.catalog.domain.entities.product import Product


class IGetProductUseCase(ABC):
    @abstractmethod
    async def execute(self, product_id: int) -> Product:
        """Retrieve a product by its ID."""
        ...

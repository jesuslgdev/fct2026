from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from modules.catalog.domain.entities.product import Product


class IProductReader(ABC):
    """Cross-module contract for reading product data.

    Implemented by the catalog module, consumed by any module
    that needs product information without importing catalog directly.
    """

    @abstractmethod
    async def get_by_id(self, product_id: int) -> Product | None: ...

    @abstractmethod
    async def get_by_code(self, product_code: str) -> Product | None: ...

    @abstractmethod
    async def is_active(self, product_id: int) -> bool: ...

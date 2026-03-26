from abc import ABC, abstractmethod

from modules.suppliers.domain.dtos.supplier_product_detail import (
    SupplierProductDetail,
)
from modules.suppliers.domain.entities.supplier import Supplier


class IGetSupplierUseCase(ABC):
    @abstractmethod
    async def execute(
        self, supplier_id: int
    ) -> tuple[Supplier, list[SupplierProductDetail]]: ...

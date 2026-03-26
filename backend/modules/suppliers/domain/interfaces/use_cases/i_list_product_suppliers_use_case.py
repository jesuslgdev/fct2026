from abc import ABC, abstractmethod

from modules.suppliers.domain.entities.product_supplier_detail import (
    ProductSupplierDetail,
)
from shared.domain.paginated_result import PaginatedResult


class IListProductSuppliersUseCase(ABC):
    @abstractmethod
    async def execute(
        self, product_id: int, page: int, page_size: int
    ) -> PaginatedResult[ProductSupplierDetail]: ...

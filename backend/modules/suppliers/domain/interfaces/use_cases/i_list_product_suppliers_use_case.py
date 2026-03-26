from abc import ABC, abstractmethod

from modules.suppliers.domain.dtos.product_supplier_detail import (
    ProductSupplierDetail,
)
from shared.domain.dtos.paginated_result import PaginatedResult


class IListProductSuppliersUseCase(ABC):
    @abstractmethod
    async def execute(
        self, product_id: int, page: int, page_size: int
    ) -> PaginatedResult[ProductSupplierDetail]: ...

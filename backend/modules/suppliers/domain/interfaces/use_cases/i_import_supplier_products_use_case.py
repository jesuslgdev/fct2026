from abc import ABC, abstractmethod

from modules.suppliers.domain.dtos.import_result import ImportResult


class IImportSupplierProductsUseCase(ABC):
    @abstractmethod
    async def execute(self, supplier_id: int, file_content: bytes) -> ImportResult: ...

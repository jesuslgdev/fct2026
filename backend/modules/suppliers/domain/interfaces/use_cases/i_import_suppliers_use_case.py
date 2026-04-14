from abc import ABC, abstractmethod

from modules.suppliers.domain.dtos.import_result import ImportResult


class IImportSuppliersUseCase(ABC):
    @abstractmethod
    async def execute(self, file_content: bytes) -> ImportResult: ...

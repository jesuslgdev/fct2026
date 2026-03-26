from abc import ABC, abstractmethod

from modules.suppliers.domain.entities.import_result import ImportResult


class IImportSuppliersUseCase(ABC):
    @abstractmethod
    async def execute(self, file_content: bytes) -> ImportResult: ...

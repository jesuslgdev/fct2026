from abc import ABC, abstractmethod


class ISetSupplierActiveUseCase(ABC):
    @abstractmethod
    async def execute(self, supplier_id: int, is_active: bool) -> None: ...

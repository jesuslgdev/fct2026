from abc import ABC, abstractmethod


class IRemoveProductFromSupplierUseCase(ABC):
    @abstractmethod
    async def execute(self, supplier_id: int, product_id: int) -> None: ...

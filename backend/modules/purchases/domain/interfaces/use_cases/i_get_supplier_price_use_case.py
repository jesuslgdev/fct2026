from abc import ABC, abstractmethod


class IGetSupplierPriceUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        purchase_id: int,
        product_id: int,
    ) -> dict: ...

from abc import ABC, abstractmethod


class IDeletePurchaseUseCase(ABC):
    @abstractmethod
    async def execute(self, purchase_id: int) -> None: ...

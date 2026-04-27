from abc import ABC, abstractmethod


class IDeleteSaleUseCase(ABC):
    @abstractmethod
    async def execute(self, sale_id: int) -> None: ...

from abc import ABC, abstractmethod


class IDownloadSupplierProductTemplateUseCase(ABC):
    @abstractmethod
    async def execute(self, product_ids: list[int] | None = None) -> bytes: ...

from abc import ABC, abstractmethod


class IDownloadSupplierProductTemplateUseCase(ABC):
    @abstractmethod
    def execute(self) -> bytes: ...

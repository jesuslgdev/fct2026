from abc import ABC, abstractmethod


class IDownloadSupplierTemplateUseCase(ABC):
    @abstractmethod
    def execute(self) -> bytes: ...

from abc import ABC, abstractmethod


class ISetProductActiveUseCase(ABC):
    @abstractmethod
    async def execute(self, product_id: int, is_active: bool) -> None:
        """Activate or deactivate a product."""
        ...

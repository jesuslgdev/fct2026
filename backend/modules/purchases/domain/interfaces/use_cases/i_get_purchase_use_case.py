from abc import ABC, abstractmethod

from modules.purchases.domain.entities.purchase import Purchase


class IGetPurchaseUseCase(ABC):
    """Contract for the use case that retrieves a single purchase by its identifier."""

    @abstractmethod
    async def execute(self, purchase_id: int) -> Purchase:
        """Fetch the purchase with the given identifier.

        Args:
            purchase_id: Primary key of the purchase to retrieve.

        Returns:
            The ``Purchase`` entity matching the given identifier.

        Raises:
            PurchaseException: With code ``7101`` (``PURCHASE_NOT_FOUND``) when
                no purchase with the given identifier exists.
        """
        ...

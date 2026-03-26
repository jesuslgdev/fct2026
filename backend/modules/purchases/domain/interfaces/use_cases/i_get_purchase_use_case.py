from abc import ABC, abstractmethod

from modules.purchases.domain.entities.purchase_enriched import PurchaseEnriched


class IGetPurchaseUseCase(ABC):
    """Contract for the use case that retrieves a single purchase by its identifier."""

    @abstractmethod
    async def execute(self, purchase_id: int) -> PurchaseEnriched:
        """Fetch the purchase with the given identifier and resolve display names.

        Args:
            purchase_id: Primary key of the purchase to retrieve.

        Returns:
            A ``PurchaseEnriched`` value object containing the purchase entity
            and all resolved display names.

        Raises:
            PurchaseException: With code ``7101`` (``PURCHASE_NOT_FOUND``) when
                no purchase with the given identifier exists.
        """
        ...

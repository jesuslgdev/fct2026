from modules.purchases.domain.entities.purchase_enriched import PurchaseEnriched
from modules.purchases.domain.exceptions import PurchaseException, PurchaseExceptionInfo
from modules.purchases.domain.interfaces.repositories.i_purchase_repository import (
    IPurchaseRepository,
)
from modules.purchases.domain.interfaces.use_cases.i_get_purchase_use_case import (
    IGetPurchaseUseCase,
)
from shared.domain.interfaces.i_product_reader import IProductReader
from shared.domain.interfaces.i_supplier_reader import ISupplierReader
from shared.domain.interfaces.i_user_reader import IUserReader


class GetPurchaseUseCase(IGetPurchaseUseCase):
    """Fetches the full detail of a purchase and resolves all display names.

    Raises ``PurchaseException(PURCHASE_NOT_FOUND)`` when the identifier does
    not match any existing purchase so the HTTP layer can return a ``404``.
    """

    def __init__(
        self,
        repo: IPurchaseRepository,
        supplier_reader: ISupplierReader,
        user_reader: IUserReader,
        product_reader: IProductReader,
    ) -> None:
        """Initialise the use case with its repository and cross-module readers.

        Args:
            repo: ``IPurchaseRepository`` implementation injected by the
                dependency container.
            supplier_reader: Reader used to resolve the supplier name.
            user_reader: Reader used to resolve the creator's full name.
            product_reader: Reader used to resolve product names for each line.
        """
        self._repo = repo
        self._supplier_reader = supplier_reader
        self._user_reader = user_reader
        self._product_reader = product_reader

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
        purchase = await self._repo.get_by_id(purchase_id)
        if purchase is None:
            raise PurchaseException(PurchaseExceptionInfo.PURCHASE_NOT_FOUND)

        supplier_name = await self._supplier_reader.get_name_by_id(purchase.supplier_id)
        user_name = await self._user_reader.get_name_by_id(purchase.user_id)

        product_names: dict[int, str | None] = {}
        for line in purchase.lines:
            if line.product_id not in product_names:
                product = await self._product_reader.get_by_id(line.product_id)
                product_names[line.product_id] = product.name if product else None

        return PurchaseEnriched(
            purchase=purchase,
            supplier_name=supplier_name,
            user_name=user_name,
            warehouse_name=None,
            product_names=product_names,
        )

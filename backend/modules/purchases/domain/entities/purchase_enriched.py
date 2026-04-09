from __future__ import annotations

from dataclasses import dataclass

from modules.purchases.domain.entities.purchase import Purchase


@dataclass(frozen=True)
class PurchaseEnriched:
    """Immutable read model that combines a purchase with resolved display names.

    This value object is produced by ``GetPurchaseUseCase`` and consumed by
    the HTTP layer to build the detail response without requiring the router
    to know about cross-module readers.

    Attributes:
        purchase: The core ``Purchase`` entity with its lines pre-loaded.
        supplier_name: Resolved name of the supplier, or ``None`` if not found.
        user_name: Full name of the user who created the purchase, or ``None``.
        warehouse_name: Name of the destination warehouse, or ``None`` when the
            warehouse module is not yet integrated.
        product_names: Mapping of ``product_id`` to product name for every line
            in the purchase.
    """

    purchase: Purchase
    supplier_name: str | None
    user_name: str | None
    warehouse_name: str | None
    product_names: dict[int, str | None]

from dataclasses import dataclass

from shared.domain.dtos.address import Address


@dataclass(frozen=True)
class WarehouseDetail:
    """Warehouse with its aggregated total stock.

    Attributes:
        warehouse_id: Warehouse primary key.
        name: Warehouse display name.
        address: Warehouse full address.
        total_stock: Sum of all product stock in this warehouse.
    """

    warehouse_id: int
    name: str
    address: Address
    total_stock: int

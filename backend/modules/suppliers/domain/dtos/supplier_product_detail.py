from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class SupplierProductDetail:
    product_id: int
    product_name: str
    product_code: str
    category_name: str | None
    supplier_price: Decimal

from dataclasses import dataclass
from decimal import Decimal


@dataclass
class ProductSupplierDetail:
    supplier_id: int
    supplier_name: str
    tax_id: str
    supplier_price: Decimal

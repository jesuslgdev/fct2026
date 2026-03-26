from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class PurchaseDTO(BaseModel):
    purchase_id: int
    purchase_number: str
    supplier_name: str | None
    status: str
    warehouse_id: int
    created_at: datetime
    total: Decimal | None

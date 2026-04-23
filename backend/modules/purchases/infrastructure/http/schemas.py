from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class PurchaseDTO(BaseModel):
    purchase_id: int
    purchase_number: str
    supplier_name: str | None
    status: str
    warehouse_id: int
    created_at: datetime
    total: Decimal | None


class CreatePurchaseLineRequest(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(gt=0, decimal_places=2)
    discount: Decimal = Field(default=0, ge=0, decimal_places=2)


class CreatePurchaseRequest(BaseModel):
    supplier_id: int
    warehouse_id: int
    lines: list[CreatePurchaseLineRequest] = Field(min_length=1)


class PurchaseLineDTO(BaseModel):
    purchase_line_id: int
    purchase_id: int
    product_id: int
    product_name: str | None = None
    quantity: int
    unit_price: Decimal
    discount: Decimal
    line_subtotal: Decimal
    vat_rate: Decimal
    line_tax: Decimal


class UpdatePurchaseRequest(BaseModel):
    supplier_id: int
    warehouse_id: int


class AddPurchaseLineRequest(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(gt=0, decimal_places=2)
    discount: Decimal = Field(default=0, ge=0, decimal_places=2)


class UpdatePurchaseLineRequest(BaseModel):
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(gt=0, decimal_places=2)
    discount: Decimal = Field(default=0, ge=0, decimal_places=2)


class AdvancePurchaseStatusRequest(BaseModel):
    status: Literal["Approved", "In Process", "Sent", "Received"]


class SupplierPriceDTO(BaseModel):
    product_id: int
    supplier_price: Decimal


class PurchaseStatusHistoryDTO(BaseModel):
    from_status: str | None
    to_status: str
    changed_at: datetime
    changed_by_user_id: int


class PurchaseDetailDTO(BaseModel):
    purchase_id: int
    purchase_number: str
    supplier_id: int
    supplier_name: str | None = None
    user_id: int
    user_name: str | None = None
    warehouse_id: int
    warehouse_name: str | None = None
    purchase_date: datetime
    status: str
    subtotal: Decimal
    taxes: Decimal
    total: Decimal
    cancelled_at: datetime | None = None
    cancelled_by_user_id: int | None = None
    created_at: datetime
    updated_at: datetime
    lines: list[PurchaseLineDTO]
    status_history: list[PurchaseStatusHistoryDTO] = Field(default_factory=list)

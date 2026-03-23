from datetime import datetime
from decimal import Decimal

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
    unit_price: Decimal = Field(gt=0)
    discount: Decimal = Field(default=0, ge=0)


class CreatePurchaseRequest(BaseModel):
    supplier_id: int
    warehouse_id: int
    lines: list[CreatePurchaseLineRequest] = Field(min_length=1)


class PurchaseLineDTO(BaseModel):
    purchase_line_id: int
    purchase_id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    discount: Decimal
    line_subtotal: Decimal


class AddPurchaseLineRequest(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(gt=0)
    discount: Decimal = Field(default=0, ge=0)


class UpdatePurchaseLineRequest(BaseModel):
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(gt=0)
    discount: Decimal = Field(default=0, ge=0)


class SupplierPriceDTO(BaseModel):
    product_id: int
    supplier_price: Decimal


class PurchaseDetailDTO(BaseModel):
    purchase_id: int
    purchase_number: str
    supplier_id: int
    user_id: int
    warehouse_id: int
    purchase_date: datetime
    status: str
    subtotal: Decimal
    taxes: Decimal
    total: Decimal
    created_at: datetime
    updated_at: datetime
    lines: list[PurchaseLineDTO]

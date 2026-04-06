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


class AddPurchaseLineRequest(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(gt=0, decimal_places=2)
    discount: Decimal = Field(default=0, ge=0, decimal_places=2)


class UpdatePurchaseLineRequest(BaseModel):
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(gt=0, decimal_places=2)
    discount: Decimal = Field(default=0, ge=0, decimal_places=2)


class SupplierPriceDTO(BaseModel):
    product_id: int
    supplier_price: Decimal


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
    created_at: datetime
    updated_at: datetime
    lines: list[PurchaseLineDTO]

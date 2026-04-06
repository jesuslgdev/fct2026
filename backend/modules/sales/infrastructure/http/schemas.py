from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class SaleLineInput(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class CreateSaleRequest(BaseModel):
    client_id: int
    lines: list[SaleLineInput] = Field(min_length=1)


class SaleLineResponse(BaseModel):
    sale_line_id: int
    sale_id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    line_subtotal: Decimal
    vat_rate: Decimal
    line_tax: Decimal


class SaleDTO(BaseModel):
    sale_id: int
    sale_number: str
    client_id: int
    client_name: str | None
    status: str
    sale_date: datetime
    total: Decimal


class SaleDetailDTO(BaseModel):
    sale_id: int
    sale_number: str
    client_id: int
    delivery_address: str
    user_id: int
    sale_date: datetime
    status: str
    subtotal: Decimal
    taxes: Decimal
    total: Decimal
    created_at: datetime
    updated_at: datetime
    lines: list[SaleLineResponse]

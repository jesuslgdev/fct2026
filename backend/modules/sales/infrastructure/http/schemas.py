from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from modules.sales.domain.entities.sale import Sale


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

    @classmethod
    def from_entity(cls, sale: Sale) -> SaleDetailDTO:
        return cls(
            sale_id=sale.sale_id,
            sale_number=sale.sale_number,
            client_id=sale.client_id,
            delivery_address=sale.delivery_address,
            user_id=sale.user_id,
            sale_date=sale.sale_date,
            status=sale.status,
            subtotal=sale.subtotal,
            taxes=sale.taxes,
            total=sale.total,
            created_at=sale.created_at,
            updated_at=sale.updated_at,
            lines=[
                SaleLineResponse(
                    sale_line_id=line.sale_line_id,
                    sale_id=line.sale_id,
                    product_id=line.product_id,
                    quantity=line.quantity,
                    unit_price=line.unit_price,
                    line_subtotal=line.line_subtotal,
                    vat_rate=line.vat_rate,
                    line_tax=line.line_tax,
                )
                for line in sale.lines
            ],
        )

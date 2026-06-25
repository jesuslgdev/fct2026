from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from modules.sales.domain.sale_status import VALID_TRANSITIONS, allowed_next

if TYPE_CHECKING:
    from modules.sales.domain.entities.sale import Sale


class SaleLineInput(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    discount: Decimal = Field(default=Decimal("0"), ge=0)
    discount_type: Literal["percent", "amount"] = "percent"

    @model_validator(mode="after")
    def validate_percent_range(self) -> SaleLineInput:
        if self.discount_type == "percent" and self.discount >= 100:
            raise ValueError("Percentage discount must be less than 100")
        return self


class CreateSaleRequest(BaseModel):
    client_id: int
    warehouse_id: int = Field(gt=0)
    lines: list[SaleLineInput] = Field(min_length=1)


class ChangeSaleStatusRequest(BaseModel):
    new_status: str = Field(
        description="Target status. Must be a valid transition from the current status."
    )

    @field_validator("new_status")
    @classmethod
    def must_be_reachable_status(cls, v: str) -> str:
        valid = {s for targets in VALID_TRANSITIONS.values() for s in targets}
        if v not in valid:
            raise ValueError(f"Invalid status '{v}'. Must be one of: {sorted(valid)}")
        return v


class UpdateSaleRequest(BaseModel):
    client_id: int
    delivery_address: str = Field(min_length=1)
    lines: list[SaleLineInput] = Field(min_length=1)


class UpdateSaleLineRequest(BaseModel):
    quantity: int = Field(gt=0)
    discount: Decimal = Field(default=Decimal("0"), ge=0)
    discount_type: Literal["percent", "amount"] = "percent"

    @model_validator(mode="after")
    def validate_percent_range(self) -> UpdateSaleLineRequest:
        if self.discount_type == "percent" and self.discount >= 100:
            raise ValueError("Percentage discount must be less than 100")
        return self


class SaleLineResponse(BaseModel):
    sale_line_id: int
    sale_id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    discount: Decimal
    line_subtotal: Decimal
    vat_rate: Decimal
    line_tax: Decimal


class SaleStatusHistoryDTO(BaseModel):
    from_status: str | None
    to_status: str
    changed_at: datetime
    changed_by_user_id: int
    changed_by_user_name: str | None


class SaleDTO(BaseModel):
    sale_id: int
    sale_number: str
    client_id: int
    warehouse_id: int
    client_name: str | None
    creator_name: str | None = None
    status: str
    allowed_transitions: list[str]
    sale_date: datetime
    delivery_address: str
    created_at: datetime
    total: Decimal


class SaleDetailDTO(BaseModel):
    sale_id: int
    sale_number: str
    client_id: int
    client_name: str | None = None
    warehouse_id: int
    delivery_address: str
    user_id: int
    creator_name: str | None = None
    sale_date: datetime
    status: str
    allowed_transitions: list[str]
    subtotal: Decimal
    taxes: Decimal
    total: Decimal
    created_at: datetime
    updated_at: datetime
    lines: list[SaleLineResponse]
    status_history: list[SaleStatusHistoryDTO]

    @classmethod
    def from_entity(cls, sale: Sale) -> SaleDetailDTO:
        history = []
        if sale.status_history:
            history = [
                SaleStatusHistoryDTO(
                    from_status=h.from_status,
                    to_status=h.to_status,
                    changed_at=h.changed_at,
                    changed_by_user_id=h.changed_by_user_id,
                    changed_by_user_name=getattr(h, "changed_by_user_name", None),
                )
                for h in sale.status_history
            ]
        return cls(
            sale_id=sale.sale_id,
            sale_number=sale.sale_number,
            client_id=sale.client_id,
            client_name=getattr(sale, "client_name", None),
            warehouse_id=sale.warehouse_id,
            delivery_address=sale.delivery_address,
            user_id=sale.user_id,
            creator_name=getattr(sale, "creator_name", None),
            sale_date=sale.sale_date,
            status=sale.status,
            allowed_transitions=allowed_next(sale.status),
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
                    discount=line.discount,
                    line_subtotal=line.line_subtotal,
                    vat_rate=line.vat_rate,
                    line_tax=line.line_tax,
                )
                for line in sale.lines
            ],
            status_history=history,
        )

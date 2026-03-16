from decimal import Decimal

from pydantic import BaseModel, Field

from shared.constants import EMAIL_PATTERN, PHONE_PATTERN, POSTAL_CODE_PATTERN


class ImportErrorDTO(BaseModel):
    row: int
    reason: str


class ImportResultDTO(BaseModel):
    total: int
    created: int
    errors: int
    error_detail: list[ImportErrorDTO]


class SupplierProductDTO(BaseModel):
    product_id: int
    supplier_price: Decimal


class SupplierDTO(BaseModel):
    supplier_id: int
    name: str
    tax_id: str
    city: str
    is_active: bool


class SupplierDetailDTO(SupplierDTO):
    address: str
    province: str
    postal_code: str
    phone: str
    email: str
    products: list[SupplierProductDTO]


class UpdateSupplierDTO(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=150)
    address: str | None = Field(None, min_length=1, max_length=255)
    city: str | None = Field(None, min_length=1, max_length=100)
    province: str | None = Field(None, min_length=1, max_length=100)
    postal_code: str | None = Field(None, pattern=POSTAL_CODE_PATTERN)
    phone: str | None = Field(None, pattern=PHONE_PATTERN)
    email: str | None = Field(None, max_length=150, pattern=EMAIL_PATTERN)


class SetSupplierActiveDTO(BaseModel):
    is_active: bool

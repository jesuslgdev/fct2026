from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

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
    product_name: str | None = None
    product_code: str | None = None
    category_name: str | None = None
    supplier_price: Decimal


class AddSupplierProductRequest(BaseModel):
    product_id: int = Field(..., gt=0)
    supplier_price: Decimal = Field(..., gt=0, decimal_places=2)


class UpdateSupplierProductPriceRequest(BaseModel):
    supplier_price: Decimal = Field(..., gt=0, decimal_places=2)


class ProductSupplierDTO(BaseModel):
    supplier_id: int
    supplier_name: str
    tax_id: str
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


class CreateSupplierDTO(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    tax_id: str = Field(..., min_length=1, max_length=20)
    address: str = Field(..., min_length=1, max_length=300)
    city: str = Field(..., min_length=1, max_length=100)
    province: str = Field(..., min_length=1, max_length=100)
    postal_code: str = Field(..., pattern=POSTAL_CODE_PATTERN)
    phone: str = Field(..., pattern=PHONE_PATTERN)
    email: str = Field(..., max_length=255, pattern=EMAIL_PATTERN)

    @field_validator("tax_id", mode="before")
    @classmethod
    def normalize_tax_id(cls, v: str) -> str:
        return v.upper()


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

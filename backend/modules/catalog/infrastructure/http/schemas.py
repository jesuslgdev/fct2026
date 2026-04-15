from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CreateCategoryRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field("", max_length=500)


class UpdateCategoryRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)


class CategoryDTO(BaseModel):
    category_id: int
    name: str
    description: str


class ProductDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: int
    product_code: str
    name: str
    description: str | None
    category_id: int
    category_name: str | None = None
    price: Decimal
    vat_rate: Decimal
    stock_current: int
    stock_min: int
    is_active: bool


class CreateProductRequest(BaseModel):
    product_code: str = Field(..., min_length=1, max_length=50, pattern=r"^\S+$")
    name: str = Field(..., min_length=1, max_length=150)
    description: str | None = Field(None, max_length=500)
    category_id: int = Field(..., gt=0)
    price: Decimal = Field(..., gt=0, decimal_places=2)
    vat_rate: Decimal = Field(Decimal("0.21"), ge=0, le=1)
    stock_min: int = Field(0, ge=0)


class UpdateProductRequest(BaseModel):
    product_code: str | None = Field(
        None, min_length=1, max_length=50, pattern=r"^\S+$"
    )
    name: str | None = Field(None, min_length=1, max_length=150)
    description: str | None = Field(None, max_length=500)
    category_id: int | None = Field(None, gt=0)
    price: Decimal | None = Field(None, gt=0, decimal_places=2)
    vat_rate: Decimal | None = Field(None, ge=0, le=1)
    stock_min: int | None = Field(None, ge=0)


class SetProductActiveRequest(BaseModel):
    is_active: bool

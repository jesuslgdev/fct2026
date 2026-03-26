from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field, field_validator

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response wrapper."""

    items: list[T]
    total: int
    page: int
    page_size: int


class ClientDTO(BaseModel):
    """Summary representation of a client (used in list responses)."""

    model_config = ConfigDict(from_attributes=True)

    client_id: int
    name: str
    tax_id: str
    city: str
    is_active: bool


class ClientDetailDTO(ClientDTO):
    """Full representation of a client including address and contact fields."""

    address: str
    province: str
    postal_code: str
    phone: str
    email: str


class CreateClientDTO(BaseModel):
    """Payload for creating a new client."""

    name: str = Field(..., min_length=1, max_length=200)
    tax_id: str = Field(..., min_length=1, max_length=20)
    address: str = Field(..., min_length=1, max_length=300)
    city: str = Field(..., min_length=1, max_length=100)
    province: str = Field(..., min_length=1, max_length=100)
    postal_code: str = Field(..., min_length=1, max_length=10)
    phone: str = Field(..., min_length=1, max_length=20)
    email: str = Field(..., max_length=255)

    @field_validator("tax_id", mode="before")
    @classmethod
    def normalize_tax_id(cls, v: str) -> str:
        """Normalize the tax ID to uppercase before validation.

        Args:
            v: Raw tax ID string from the request body.

        Returns:
            The tax ID converted to uppercase.
        """
        return v.upper()


class UpdateClientDTO(BaseModel):
    """Payload for updating an existing client. All fields are optional.

    Note: ``tax_id`` is intentionally excluded — it is the client's legal
    identifier and cannot be changed after creation.
    """

    name: str | None = Field(None, min_length=1, max_length=200)
    address: str | None = Field(None, min_length=1, max_length=300)
    city: str | None = Field(None, min_length=1, max_length=100)
    province: str | None = Field(None, min_length=1, max_length=100)
    postal_code: str | None = Field(None, min_length=1, max_length=10)
    phone: str | None = Field(None, min_length=1, max_length=20)
    email: str | None = Field(None, max_length=255)


class SetClientActiveDTO(BaseModel):
    """Payload for toggling the active state of a client."""

    is_active: bool

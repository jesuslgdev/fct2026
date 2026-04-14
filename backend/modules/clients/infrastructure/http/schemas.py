from pydantic import BaseModel, ConfigDict, Field, field_validator

from shared.constants import EMAIL_PATTERN, PHONE_PATTERN, POSTAL_CODE_PATTERN


class ClientDTO(BaseModel):
    """Summary representation of a client (used in list responses)."""

    model_config = ConfigDict(from_attributes=True)

    client_id: int
    name: str
    tax_id: str
    city: str
    is_active: bool


class AddressDTO(BaseModel):
    street: str = Field(..., min_length=1, max_length=300)
    city: str = Field(..., min_length=1, max_length=100)
    province: str = Field(..., min_length=1, max_length=100)
    postal_code: str = Field(..., pattern=POSTAL_CODE_PATTERN)


class ClientDetailDTO(ClientDTO):
    """Full representation of a client including address and contact fields."""

    address: AddressDTO
    phone: str
    email: str


class CreateClientDTO(BaseModel):
    """Payload for creating a new client."""

    name: str = Field(..., min_length=1, max_length=200)
    tax_id: str = Field(..., min_length=1, max_length=20)
    address: AddressDTO
    phone: str = Field(..., pattern=PHONE_PATTERN)
    email: str = Field(..., max_length=255, pattern=EMAIL_PATTERN)

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

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        """Normalize emails to avoid case-sensitive duplicates."""
        return v.strip().lower()


class UpdateClientDTO(BaseModel):
    """Payload for updating an existing client. All fields are optional.

    Note: ``tax_id`` is intentionally excluded — it is the client's legal
    identifier and cannot be changed after creation.
    """

    name: str | None = Field(None, min_length=1, max_length=200)
    address: AddressDTO | None = None
    phone: str | None = Field(None, pattern=PHONE_PATTERN)
    email: str | None = Field(None, max_length=255, pattern=EMAIL_PATTERN)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_optional_email(cls, v: str | None) -> str | None:
        """Normalize optional emails to avoid case-sensitive duplicates."""
        if v is None:
            return None
        return v.strip().lower()


class SetClientActiveDTO(BaseModel):
    """Payload for toggling the active state of a client."""

    is_active: bool

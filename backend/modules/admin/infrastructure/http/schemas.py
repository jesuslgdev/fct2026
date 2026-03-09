from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int


class CreateDepartmentDTO(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class UpdateDepartmentDTO(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class DepartmentDTO(BaseModel):
    department_id: int
    name: str


class UserDTO(BaseModel):
    user_id: int
    first_name: str
    last_name: str
    email: str
    role: str
    department_id: int | None
    is_active: bool


class CreateUserDTO(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=150)
    email: str = Field(..., max_length=255)
    role: str = Field(..., pattern="^(Administrator|Manager|Employee)$")
    department_id: int | None = None


class UpdateUserDTO(BaseModel):
    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=150)
    role: str | None = Field(None, pattern="^(Administrator|Manager|Employee)$")
    department_id: int | None = None


class SetUserActiveDTO(BaseModel):
    is_active: bool

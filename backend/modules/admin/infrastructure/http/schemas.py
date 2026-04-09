from datetime import datetime

from pydantic import BaseModel, Field

from shared.constants import ROLE_PATTERN


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
    last_name: str | None
    email: str | None
    role: str
    department_id: int | None
    is_active: bool
    last_login_at: datetime | None


class CreateUserDTO(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=150)
    email: str = Field(..., max_length=255)
    role: str = Field(..., pattern=ROLE_PATTERN)
    department_id: int | None = None


class UpdateUserDTO(BaseModel):
    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=150)
    role: str | None = Field(None, pattern=ROLE_PATTERN)
    department_id: int | None = None


class ActivateUserDTO(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=150)
    email: str = Field(..., max_length=255)

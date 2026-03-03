from pydantic import BaseModel, ConfigDict, Field


class CreateDepartmentDTO(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class UpdateDepartmentDTO(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class DepartmentDTO(BaseModel):
    department_id: int
    name: str

    model_config = ConfigDict(from_attributes=True)

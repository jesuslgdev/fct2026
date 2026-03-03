from pydantic import BaseModel, ConfigDict


class DepartmentDTO(BaseModel):
    department_id: int
    name: str

    model_config = ConfigDict(from_attributes=True)

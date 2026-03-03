from pydantic import BaseModel


class LoginResponseDTO(BaseModel):
    role: str
    department_id: int | None
    name: str

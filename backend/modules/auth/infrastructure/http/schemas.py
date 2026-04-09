from pydantic import BaseModel


class LoginRequestDTO(BaseModel):
    firebase_id_token: str


class LoginResponseDTO(BaseModel):
    role: str
    department_id: int | None
    name: str
    permissions: list[str]

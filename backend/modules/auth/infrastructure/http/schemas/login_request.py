from pydantic import BaseModel


class LoginRequestDTO(BaseModel):
    firebase_id_token: str

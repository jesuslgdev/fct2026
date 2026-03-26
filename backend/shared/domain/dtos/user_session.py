from dataclasses import dataclass


@dataclass(frozen=True)
class UserSession:
    user_id: int
    email: str
    role: str
    department_id: int | None
    firebase_uid: str
    name: str

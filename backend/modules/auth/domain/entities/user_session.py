from dataclasses import dataclass


@dataclass
class UserSession:
    email: str
    role: str
    department_id: int | None
    firebase_uid: str

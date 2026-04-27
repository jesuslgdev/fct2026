from fastapi import HTTPException, status

from modules.auth.domain.dtos.login_result import LoginResult
from modules.auth.domain.interfaces.repositories.i_auth_repository import (
    IAuthRepository,
)
from modules.auth.domain.interfaces.use_cases.i_login_use_case import ILoginUseCase
from shared.domain.dtos.user_session import UserSession
from shared.domain.interfaces.i_department_reader import IDepartmentReader
from shared.infrastructure.security.firebase_auth_provider import verify_firebase_token


def _compute_permissions(role: str, department_name: str | None) -> list[str]:
    if role == "Administrator":
        return [
            "admin",
            "purchases_manager",
            "sales_manager",
            "purchases_department",
            "sales_department",
        ]
    perms: list[str] = []
    if role == "Manager" and department_name == "Purchases":
        perms += ["purchases_manager", "purchases_department"]
    elif role == "Manager" and department_name == "Sales":
        perms += ["sales_manager", "sales_department"]
    elif department_name == "Purchases":
        perms += ["purchases_department"]
    elif department_name == "Sales":
        perms += ["sales_department"]
    return perms


class LoginUseCase(ILoginUseCase):
    def __init__(
        self,
        auth_repository: IAuthRepository,
        department_reader: IDepartmentReader,
    ) -> None:
        self._repo = auth_repository
        self._dept_reader = department_reader

    async def login(self, firebase_id_token: str) -> LoginResult:
        try:
            claims = verify_firebase_token(firebase_id_token)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )

        email: str = claims["email"]
        user = await self._repo.find_user_by_email(email)

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        if not user.is_active and user.last_login_at is not None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        if not user.is_active and user.last_login_at is None:
            await self._repo.activate_user(user.user_id)
        else:
            await self._repo.update_last_login(user.user_id)

        dept_name = (
            await self._dept_reader.get_name_by_id(user.department_id)
            if user.department_id
            else None
        )
        permissions = _compute_permissions(user.role, dept_name)

        return LoginResult(
            session=UserSession(
                user_id=user.user_id,
                email=user.email,
                role=user.role,
                department_id=user.department_id,
                firebase_uid=claims["uid"],
                name=f"{user.first_name} {user.last_name}",
                last_login_at=user.last_login_at,
            ),
            permissions=permissions,
        )

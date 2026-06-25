from fastapi import APIRouter, Depends

from composition.dependencies import get_login_use_case, get_logout_use_case
from composition.security import get_current_user
from modules.auth.domain.interfaces.use_cases.i_login_use_case import ILoginUseCase
from modules.auth.domain.interfaces.use_cases.i_logout_use_case import ILogoutUseCase
from modules.auth.infrastructure.http.schemas import LoginRequestDTO, LoginResponseDTO
from shared.domain.dtos.user_session import UserSession

router = APIRouter(prefix="/auth", tags=["Auth"])


# ── Authentication ──────────────────────────────────────────────


@router.post("/login", response_model=LoginResponseDTO)
async def login(
    body: LoginRequestDTO,
    use_case: ILoginUseCase = Depends(get_login_use_case),
) -> LoginResponseDTO:
    """Authenticate a user with a Firebase ID token."""
    result = await use_case.login(body.firebase_id_token)
    return LoginResponseDTO(
        role=result.session.role,
        department_id=result.session.department_id,
        name=result.session.name,
        permissions=result.permissions,
    )


@router.post("/logout", status_code=204)
async def logout(
    current_user: UserSession = Depends(get_current_user),
    use_case: ILogoutUseCase = Depends(get_logout_use_case),
) -> None:
    """Revoke the current user session."""
    use_case.logout(current_user.firebase_uid)

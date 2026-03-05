from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from composition.security import get_current_user
from modules.auth.application.login_use_case import LoginUseCase
from modules.auth.application.logout_use_case import LogoutUseCase
from modules.auth.infrastructure.http.schemas import LoginRequestDTO, LoginResponseDTO
from modules.auth.infrastructure.repos.auth_repository import AuthRepository
from shared.domain.entities.user_session import UserSession
from shared.infrastructure.database.connection import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponseDTO)
async def login(
    body: LoginRequestDTO,
    db: AsyncSession = Depends(get_db),
) -> LoginResponseDTO:
    session = await LoginUseCase(AuthRepository(db)).login(body.firebase_id_token)
    return LoginResponseDTO(
        role=session.role,
        department_id=session.department_id,
        name=session.name,
    )


@router.post("/logout", status_code=204)
async def logout(
    current_user: UserSession = Depends(get_current_user),
) -> None:
    LogoutUseCase().logout(current_user.firebase_uid)

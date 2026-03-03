from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from modules.auth.application.login_use_case import LoginUseCase
from modules.auth.infrastructure.http.schemas.login_request import LoginRequestDTO
from modules.auth.infrastructure.http.schemas.login_response import LoginResponseDTO
from modules.auth.infrastructure.repos.auth_repository import AuthRepository
from shared.infrastructure.database.connection import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponseDTO)
async def login(
    body: LoginRequestDTO,
    db: AsyncSession = Depends(get_db),
) -> LoginResponseDTO:
    use_case = LoginUseCase(AuthRepository(db))
    return await use_case.login(body.firebase_id_token)

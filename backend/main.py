from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select, text

from composition.router_registry import register_routers
from composition.security import get_current_user
from shared.config import settings
from shared.domain.dtos.user_session import UserSession
from shared.domain.entities.user import User
from shared.exceptions import AppException
from shared.infrastructure.database.connection import AsyncSessionLocal, engine
from shared.infrastructure.database.seed import seed
from shared.infrastructure.security.firebase_client import init_firebase_app


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_firebase_app()
    async with AsyncSessionLocal() as session:
        await seed(session)
    yield


app = FastAPI(
    title="FCT2026 ERP API",
    version="0.1.0",
    description="Backend API for the ERP system",
    lifespan=lifespan,
)

# TODO: restrict origins in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if settings.disable_auth:

    async def _mock_user() -> UserSession:
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(User).where(User.email == "admin@example.com")
            )
            user = result.scalar_one_or_none()

        if user is not None:
            return UserSession(
                user_id=user.user_id,
                email=user.email,
                role=user.role,
                department_id=user.department_id,
                firebase_uid="dev-user",
                name=f"{user.first_name} {user.last_name}".strip(),
                last_login_at=user.last_login_at,
            )

        return UserSession(
            user_id=1,
            email="dev@local.dev",
            role="Administrator",
            department_id=None,
            firebase_uid="dev-user",
            name="Dev User",
            last_login_at=None,
        )

    app.dependency_overrides[get_current_user] = _mock_user

register_routers(app)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.info.http_status,
        content={"error_code": exc.info.code, "detail": exc.info.message},
    )


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/ready")
async def ready() -> dict:
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    return {"status": "ready"}

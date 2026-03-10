from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from composition.router_registry import register_routers
from composition.security import get_current_user
from shared.config import settings
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

    async def _mock_user() -> dict:
        return {"uid": "dev-user", "email": "dev@local.dev"}

    app.dependency_overrides[get_current_user] = _mock_user

register_routers(app)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/ready")
async def ready() -> dict:
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    return {"status": "ready"}

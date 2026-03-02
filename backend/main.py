from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text

from composition.router_registry import register_routers
from shared.infrastructure.security.firebase_client import init_firebase_app
from shared.infrastructure.database.connection import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_firebase_app()
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

register_routers(app)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/ready")
async def ready() -> dict:
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    return {"status": "ready"}

from fastapi import FastAPI

from composition.router_registry import register_routers
from shared.infrastructure.security.firebase_client import init_firebase_app

init_firebase_app()

app = FastAPI(
    title="FCT2026 ERP API",
    version="0.1.0",
    description="Backend API for the ERP system",
)

register_routers(app)


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}

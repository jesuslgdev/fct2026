"""
Central router registry.
Import and include module routers here to keep main.py clean.
"""

from fastapi import FastAPI

from modules.auth.infrastructure.http.router import router as auth_router


def register_routers(app: FastAPI) -> None:
    """Register all module routers onto the FastAPI application."""
    app.include_router(auth_router, prefix="/api/v1")

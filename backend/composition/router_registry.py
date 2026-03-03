"""
Central router registry.
Import and include module routers here to keep main.py clean.
"""

from fastapi import FastAPI


def register_routers(app: FastAPI) -> None:
    """Register all module routers onto the FastAPI application."""
    from modules.admin.infrastructure.http.router import router as admin_router

    app.include_router(admin_router, prefix="/api/v1")

"""
Central router registry.
Import and include module routers here to keep main.py clean.
"""

from fastapi import FastAPI


def register_routers(app: FastAPI) -> None:
    """Register all module routers onto the FastAPI application."""
    # Example:
    # from modules.users.infrastructure.api.router import router as users_router
    # app.include_router(users_router, prefix="/api/v1")
    pass

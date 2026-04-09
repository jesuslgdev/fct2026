"""
Central router registry.
Import and include module routers here to keep main.py clean.
"""

from fastapi import FastAPI

from modules.admin.infrastructure.http.router import router as admin_router
from modules.auth.infrastructure.http.router import router as auth_router
from modules.catalog.infrastructure.http.router import router as catalog_router
from modules.clients.infrastructure.http.router import router as clients_router
from modules.purchases.infrastructure.http.router import router as purchases_router
from modules.suppliers.infrastructure.http.router import router as suppliers_router


def register_routers(app: FastAPI) -> None:
    """Register all module routers onto the FastAPI application."""
    from modules.warehouse.infrastructure.http.router import router as warehouse_router

    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(admin_router, prefix="/api/v1")
    app.include_router(catalog_router, prefix="/api/v1")
    app.include_router(suppliers_router, prefix="/api/v1")
    app.include_router(clients_router, prefix="/api/v1")
    app.include_router(purchases_router, prefix="/api/v1")
    app.include_router(warehouse_router, prefix="/api/v1")

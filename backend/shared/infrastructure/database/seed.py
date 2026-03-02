from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.config import settings
from shared.domain.entities.usuario import Usuario


async def seed(session: AsyncSession) -> None:
    """Insert the super-admin user if it does not already exist."""
    result = await session.execute(
        select(Usuario).where(Usuario.email == settings.superadmin_email)
    )
    if result.scalar_one_or_none() is not None:
        return

    # TODO: id_departamento omitted — assign a real department once the
    # departamentos table and admin module are implemented.
    admin = Usuario(
        nombre="Admin",
        apellido="Sistema",
        email=settings.superadmin_email,
        rol="Administrador",
        activo=True,
    )
    session.add(admin)
    await session.commit()

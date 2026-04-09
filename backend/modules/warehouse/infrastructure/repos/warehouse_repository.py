from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.warehouse.domain.entities.warehouse import Warehouse
from modules.warehouse.domain.entities.warehouse_stock import WarehouseStock
from modules.warehouse.domain.interfaces.repositories.i_warehouse_repository import (
    IWarehouseRepository,
)
from shared.domain.interfaces.i_warehouse_reader import IWarehouseReader


class WarehouseRepository(IWarehouseRepository, IWarehouseReader):
    """SQLAlchemy implementation of the warehouse CRUD repository."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_all(self) -> list[Warehouse]:
        result = await self._db.execute(select(Warehouse).order_by(Warehouse.name))
        return list(result.scalars().all())

    async def get_by_id(self, warehouse_id: int) -> Warehouse | None:
        result = await self._db.execute(
            select(Warehouse).where(Warehouse.warehouse_id == warehouse_id)
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> Warehouse | None:
        result = await self._db.execute(select(Warehouse).where(Warehouse.name == name))
        return result.scalar_one_or_none()

    async def create(self, name: str, address: str) -> Warehouse:
        obj = Warehouse(name=name, address=address)
        self._db.add(obj)
        await self._db.flush()
        await self._db.refresh(obj)
        return obj

    async def update(self, warehouse_id: int, name: str, address: str) -> Warehouse:
        obj = await self.get_by_id(warehouse_id)
        if obj is None:
            raise ValueError("Warehouse not found")
        obj.name = name
        obj.address = address
        await self._db.flush()
        await self._db.refresh(obj)
        return obj

    async def delete(self, warehouse_id: int) -> None:
        obj = await self.get_by_id(warehouse_id)
        if obj is not None:
            await self._db.delete(obj)
            await self._db.flush()

    async def get_total_stock(self, warehouse_id: int) -> int:
        result = await self._db.execute(
            select(func.coalesce(func.sum(WarehouseStock.stock), 0)).where(
                WarehouseStock.warehouse_id == warehouse_id
            )
        )
        return result.scalar_one()

    async def get_name_by_id(self, warehouse_id: int) -> str | None:
        warehouse = await self.get_by_id(warehouse_id)
        return warehouse.name if warehouse else None

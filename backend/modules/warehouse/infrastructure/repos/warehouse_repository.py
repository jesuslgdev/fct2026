from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.warehouse.domain.entities.stock_movement import StockMovement
from modules.warehouse.domain.entities.warehouse import Warehouse
from modules.warehouse.domain.entities.warehouse_stock import WarehouseStock
from modules.warehouse.domain.interfaces.repositories.i_warehouse_repository import (
    IWarehouseRepository,
)
from shared.domain.dtos.address import Address
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

    async def create(self, name: str, address_data: Address) -> Warehouse:
        obj = Warehouse(name=name, address_data=address_data)
        self._db.add(obj)
        await self._db.flush()
        await self._db.refresh(obj)
        return obj

    async def update(
        self, warehouse_id: int, name: str, address_data: Address
    ) -> Warehouse:
        obj = await self.get_by_id(warehouse_id)
        if obj is None:
            raise ValueError("Warehouse not found")
        obj.name = name
        obj.address_data = address_data
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

    async def has_stock_history(self, warehouse_id: int) -> bool:
        """Return True if any warehouse_stock row or stock_movement exists
        for this warehouse (audit trail or stock record, even with stock=0)."""
        stock_exists = (
            select(WarehouseStock.warehouse_stock_id)
            .where(WarehouseStock.warehouse_id == warehouse_id)
            .limit(1)
        )
        movement_exists = (
            select(StockMovement.movement_id)
            .where(StockMovement.warehouse_id == warehouse_id)
            .limit(1)
        )
        result = await self._db.execute(
            select(or_(stock_exists.exists(), movement_exists.exists()))
        )
        return bool(result.scalar())

    async def get_name_by_id(self, warehouse_id: int) -> str | None:
        warehouse = await self.get_by_id(warehouse_id)
        return warehouse.name if warehouse else None

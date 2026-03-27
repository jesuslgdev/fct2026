from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.purchases.domain.entities.purchase import Purchase
from shared.domain.interfaces.i_purchase_reader import IPurchaseReader


class PurchaseReader(IPurchaseReader):
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def has_purchases_for_user(self, user_id: int) -> bool:
        result = await self._db.execute(
            select(func.count())
            .select_from(Purchase)
            .where(Purchase.user_id == user_id)
        )
        return result.scalar_one() > 0

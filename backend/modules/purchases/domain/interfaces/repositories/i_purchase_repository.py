from abc import ABC, abstractmethod
from datetime import datetime
from decimal import Decimal

from modules.purchases.domain.entities.purchase import Purchase
from shared.domain.paginated_result import PaginatedResult


class IPurchaseRepository(ABC):
    @abstractmethod
    async def get_all_paginated(
        self,
        page: int,
        page_size: int,
        sort_field: str,
        sort_order: str,
        status: str | None,
        supplier_id: int | None,
        date_from: datetime | None,
        date_to: datetime | None,
        search: str | None = None,
    ) -> PaginatedResult[tuple]: ...

    @abstractmethod
    async def generate_purchase_number(self) -> str: ...

    @abstractmethod
    async def create(
        self,
        purchase_number: str,
        supplier_id: int,
        user_id: int,
        warehouse_id: int,
        status: str,
        subtotal: Decimal,
        taxes: Decimal,
        total: Decimal,
        lines: list[dict],
    ) -> Purchase: ...

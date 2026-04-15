from abc import ABC, abstractmethod
from datetime import datetime
from decimal import Decimal

from modules.sales.domain.entities.sale import Sale
from shared.domain.dtos.paginated_result import PaginatedResult


class ISaleRepository(ABC):
    @abstractmethod
    async def generate_sale_number(self) -> str: ...

    @abstractmethod
    async def create(
        self,
        sale_number: str,
        client_id: int,
        delivery_address: str,
        user_id: int,
        status: str,
        subtotal: Decimal,
        taxes: Decimal,
        total: Decimal,
        lines: list[dict],
    ) -> Sale: ...

    @abstractmethod
    async def get_by_id(self, sale_id: int) -> Sale | None: ...

    @abstractmethod
    async def get_all_paginated(
        self,
        page: int,
        page_size: int,
        sort_field: str,
        sort_order: str,
        status: str | None,
        client_id: int | None,
        date_from: datetime | None,
        date_to: datetime | None,
        search: str | None = None,
    ) -> PaginatedResult: ...

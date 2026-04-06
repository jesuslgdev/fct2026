from abc import ABC, abstractmethod
from datetime import datetime
from decimal import Decimal

from modules.purchases.domain.entities.purchase import Purchase
from modules.purchases.domain.entities.purchase_line import PurchaseLine
from shared.domain.dtos.paginated_result import PaginatedResult


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
    async def get_by_id(self, purchase_id: int) -> Purchase | None: ...

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

    @abstractmethod
    async def get_line_by_id(self, purchase_line_id: int) -> PurchaseLine | None: ...

    @abstractmethod
    async def add_line(
        self,
        purchase_id: int,
        product_id: int,
        quantity: int,
        unit_price: Decimal,
        discount: Decimal,
        line_subtotal: Decimal,
    ) -> PurchaseLine: ...

    @abstractmethod
    async def update_line(
        self,
        purchase_line_id: int,
        quantity: int,
        unit_price: Decimal,
        discount: Decimal,
        line_subtotal: Decimal,
    ) -> PurchaseLine: ...

    @abstractmethod
    async def delete_line(self, purchase_line_id: int) -> None: ...

    @abstractmethod
    async def update_totals(
        self,
        purchase_id: int,
        subtotal: Decimal,
        taxes: Decimal,
        total: Decimal,
    ) -> Purchase: ...

    @abstractmethod
    async def update_header(
        self,
        purchase_id: int,
        supplier_id: int,
        warehouse_id: int,
    ) -> Purchase: ...

    @abstractmethod
    async def delete_all_lines(self, purchase_id: int) -> None: ...

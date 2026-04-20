from modules.sales.domain.entities.sale import Sale
from modules.sales.domain.entities.sale_status_history import SaleStatusHistory
from modules.sales.domain.exceptions import SaleException, SaleExceptionInfo
from modules.sales.domain.interfaces.repositories.i_sale_repository import (
    ISaleRepository,
)
from modules.sales.domain.interfaces.use_cases.i_advance_sale_status_use_case import (
    IAdvanceSaleStatusUseCase,
)
from modules.sales.domain.sale_status import (
    APPROVED,
    CANCELLED,
    VALID_TRANSITIONS,
)
from shared.domain.dtos.user_session import UserSession
from shared.domain.interfaces.i_product_reader import IProductReader
from shared.domain.interfaces.i_stock_entry_recorder import IStockEntryRecorder
from shared.domain.interfaces.i_stock_output_recorder import IStockOutputRecorder


class AdvanceSaleStatusUseCase(IAdvanceSaleStatusUseCase):
    def __init__(
        self,
        sale_repo: ISaleRepository,
        product_reader: IProductReader,
        stock_output_recorder: IStockOutputRecorder,
        stock_entry_recorder: IStockEntryRecorder,
    ) -> None:
        self._sale_repo = sale_repo
        self._product_reader = product_reader
        self._stock_output_recorder = stock_output_recorder
        self._stock_entry_recorder = stock_entry_recorder

    async def execute(
        self,
        sale_id: int,
        new_status: str,
        actor: UserSession,
    ) -> Sale:
        sale = await self._sale_repo.get_by_id(sale_id)
        if sale is None:
            raise SaleException(SaleExceptionInfo.SALE_NOT_FOUND)

        allowed = VALID_TRANSITIONS.get(sale.status, set())
        if not allowed:
            raise SaleException(SaleExceptionInfo.SALE_TERMINAL_STATE)
        if new_status not in allowed:
            raise SaleException(SaleExceptionInfo.SALE_INVALID_TRANSITION)

        if new_status == APPROVED:
            await self._reserve_stock(sale, actor.email)
        elif new_status == CANCELLED and sale.status == APPROVED:
            await self._release_stock(sale, actor.email)

        from_status = sale.status
        sale.status = new_status

        await self._sale_repo.save(sale)

        history = SaleStatusHistory(
            sale_id=sale.sale_id,
            from_status=from_status,
            to_status=new_status,
            changed_by_user_id=actor.user_id,
        )
        await self._sale_repo.add_status_history(history)

        return sale

    async def _reserve_stock(self, sale: Sale, user_email: str) -> None:
        """Deduct warehouse stock for each line on approval (reservation)."""
        for line in sale.lines:
            product = await self._product_reader.get_by_id(line.product_id)
            if product is None:
                raise SaleException(SaleExceptionInfo.PRODUCT_NOT_FOUND)
            if product.stock_current < line.quantity:
                raise SaleException(SaleExceptionInfo.INSUFFICIENT_STOCK)
            await self._stock_output_recorder.remove_stock(
                warehouse_id=sale.warehouse_id,
                product_id=line.product_id,
                quantity=line.quantity,
                user_email=user_email,
                reason=f"Sale {sale.sale_number} approved",
            )

    async def _release_stock(self, sale: Sale, user_email: str) -> None:
        """Return warehouse stock for each line on cancellation."""
        for line in sale.lines:
            await self._stock_entry_recorder.add_stock(
                warehouse_id=sale.warehouse_id,
                product_id=line.product_id,
                quantity=line.quantity,
                user_email=user_email,
                reason=f"Sale {sale.sale_number} cancelled",
            )

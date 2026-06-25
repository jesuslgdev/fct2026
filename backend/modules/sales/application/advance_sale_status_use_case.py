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
    DELIVERED,
    VALID_TRANSITIONS,
)
from shared.domain.dtos.user_session import UserSession
from shared.domain.interfaces.i_client_reader import IClientReader
from shared.domain.interfaces.i_stock_availability_reader import (
    IStockAvailabilityReader,
)
from shared.domain.interfaces.i_stock_output_recorder import IStockOutputRecorder
from shared.domain.interfaces.i_stock_reservation_recorder import (
    IStockReservationRecorder,
)
from shared.domain.interfaces.i_user_reader import IUserReader


class AdvanceSaleStatusUseCase(IAdvanceSaleStatusUseCase):
    def __init__(
        self,
        sale_repo: ISaleRepository,
        stock_reader: IStockAvailabilityReader,
        stock_reservation_recorder: IStockReservationRecorder,
        stock_output_recorder: IStockOutputRecorder,
        user_reader: IUserReader,
        client_reader: IClientReader,
    ) -> None:
        self._sale_repo = sale_repo
        self._stock_reader = stock_reader
        self._stock_reservation_recorder = stock_reservation_recorder
        self._stock_output_recorder = stock_output_recorder
        self._user_reader = user_reader
        self._client_reader = client_reader

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
            await self._release_reservation(sale, actor.email)
        elif new_status == DELIVERED:
            await self._record_delivery_output(sale, actor.email)

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
        sale.status_history.append(history)

        creator_name = await self._user_reader.get_name_by_id(sale.user_id)
        client_name = await self._client_reader.get_name_by_id(sale.client_id)
        setattr(sale, "creator_name", creator_name)
        setattr(sale, "client_name", client_name)

        return sale

    async def _reserve_stock(self, sale: Sale, user_email: str) -> None:
        """Mark each line's quantity as reserved in the warehouse on approval."""
        for line in sale.lines:
            available = await self._stock_reader.get_available_stock(
                sale.warehouse_id, line.product_id
            )
            if available < line.quantity:
                raise SaleException(SaleExceptionInfo.INSUFFICIENT_STOCK)
            await self._stock_reservation_recorder.reserve(
                warehouse_id=sale.warehouse_id,
                product_id=line.product_id,
                quantity=line.quantity,
                user_email=user_email,
                reason=f"Sale {sale.sale_number} approved",
            )

    async def _release_reservation(self, sale: Sale, user_email: str) -> None:
        """Release the stock reservation when a sale is cancelled."""
        for line in sale.lines:
            await self._stock_reservation_recorder.release(
                warehouse_id=sale.warehouse_id,
                product_id=line.product_id,
                quantity=line.quantity,
                user_email=user_email,
                reason=f"Sale {sale.sale_number} cancelled",
            )

    async def _record_delivery_output(self, sale: Sale, user_email: str) -> None:
        """Record the physical stock output and clear the reservation on delivery."""
        for line in sale.lines:
            await self._stock_output_recorder.remove_stock(
                warehouse_id=sale.warehouse_id,
                product_id=line.product_id,
                quantity=line.quantity,
                user_email=user_email,
                reason=f"Sale {sale.sale_number} delivered",
                sale_id=sale.sale_id,
            )
            await self._stock_reservation_recorder.release(
                warehouse_id=sale.warehouse_id,
                product_id=line.product_id,
                quantity=line.quantity,
                user_email=user_email,
                reason=f"Sale {sale.sale_number} delivered",
            )

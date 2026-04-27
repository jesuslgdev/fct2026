from decimal import Decimal

from modules.sales.application._discount import normalize_discount_to_rate
from modules.sales.domain.entities.sale import Sale
from modules.sales.domain.exceptions import SaleException, SaleExceptionInfo
from modules.sales.domain.interfaces.repositories.i_sale_repository import (
    ISaleRepository,
)
from modules.sales.domain.interfaces.use_cases.i_update_sale_line_use_case import (
    IUpdateSaleLineUseCase,
)
from shared.domain.interfaces.i_client_reader import IClientReader
from shared.domain.interfaces.i_stock_availability_reader import (
    IStockAvailabilityReader,
)
from shared.domain.interfaces.i_user_reader import IUserReader


class UpdateSaleLineUseCase(IUpdateSaleLineUseCase):
    def __init__(
        self,
        sale_repo: ISaleRepository,
        stock_reader: IStockAvailabilityReader,
        client_reader: IClientReader,
        user_reader: IUserReader,
    ) -> None:
        self._sale_repo = sale_repo
        self._stock_reader = stock_reader
        self._client_reader = client_reader
        self._user_reader = user_reader

    async def execute(
        self,
        sale_id: int,
        sale_line_id: int,
        quantity: int,
        discount: Decimal,
        discount_type: str,
    ) -> Sale:
        sale = await self._sale_repo.get_by_id(sale_id)
        if sale is None:
            raise SaleException(SaleExceptionInfo.SALE_NOT_FOUND)
        if sale.status != "Pending":
            raise SaleException(SaleExceptionInfo.SALE_NOT_PENDING)

        line = await self._sale_repo.get_line_by_id(sale_line_id)
        if line is None or line.sale_id != sale_id:
            raise SaleException(SaleExceptionInfo.SALE_LINE_NOT_FOUND)

        unit_price = line.unit_price
        other_qty = sum(
            ln.quantity
            for ln in sale.lines
            if ln.product_id == line.product_id and ln.sale_line_id != sale_line_id
        )
        available = await self._stock_reader.get_available_stock(
            sale.warehouse_id, line.product_id
        )
        if available < other_qty + quantity:
            raise SaleException(SaleExceptionInfo.INSUFFICIENT_STOCK)

        discount_rate = normalize_discount_to_rate(
            discount, discount_type, unit_price, quantity
        )
        line_subtotal = quantity * unit_price * (1 - discount_rate)
        line_tax = line_subtotal * line.vat_rate

        await self._sale_repo.update_line(
            sale_line_id=sale_line_id,
            quantity=quantity,
            discount=discount_rate,
            line_subtotal=line_subtotal,
            line_tax=line_tax,
        )

        updated = await self._sale_repo.get_by_id(sale_id)
        subtotal = sum(ln.line_subtotal for ln in updated.lines)
        taxes = sum(ln.line_tax for ln in updated.lines)
        total = subtotal + taxes

        sale = await self._sale_repo.update_totals(sale_id, subtotal, taxes, total)
        setattr(
            sale,
            "client_name",
            await self._client_reader.get_name_by_id(sale.client_id),
        )
        setattr(
            sale, "creator_name", await self._user_reader.get_name_by_id(sale.user_id)
        )
        return sale

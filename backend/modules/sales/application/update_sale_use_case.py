from collections import defaultdict
from decimal import Decimal

from modules.sales.domain.entities.sale import Sale
from modules.sales.domain.exceptions import SaleException, SaleExceptionInfo
from modules.sales.domain.interfaces.repositories.i_sale_repository import (
    ISaleRepository,
)
from modules.sales.domain.interfaces.use_cases.i_update_sale_use_case import (
    IUpdateSaleUseCase,
)
from shared.domain.interfaces.i_client_reader import IClientReader
from shared.domain.interfaces.i_product_reader import IProductReader
from shared.domain.interfaces.i_stock_availability_reader import (
    IStockAvailabilityReader,
)
from shared.domain.interfaces.i_user_reader import IUserReader


class UpdateSaleUseCase(IUpdateSaleUseCase):
    def __init__(
        self,
        sale_repo: ISaleRepository,
        client_reader: IClientReader,
        product_reader: IProductReader,
        stock_reader: IStockAvailabilityReader,
        user_reader: IUserReader,
    ) -> None:
        self._sale_repo = sale_repo
        self._client_reader = client_reader
        self._product_reader = product_reader
        self._stock_reader = stock_reader
        self._user_reader = user_reader

    async def execute(
        self,
        sale_id: int,
        client_id: int,
        delivery_address: str,
        lines: list[dict],
    ) -> Sale:
        sale = await self._sale_repo.get_by_id(sale_id)
        if sale is None:
            raise SaleException(SaleExceptionInfo.SALE_NOT_FOUND)
        if sale.status != "Pending":
            raise SaleException(SaleExceptionInfo.SALE_NOT_PENDING)

        client = await self._client_reader.get_by_id(client_id)
        if client is None:
            raise SaleException(SaleExceptionInfo.CLIENT_NOT_FOUND)
        if not client.is_active:
            raise SaleException(SaleExceptionInfo.CLIENT_NOT_ACTIVE)

        if not delivery_address or not delivery_address.strip():
            raise SaleException(SaleExceptionInfo.DELIVERY_ADDRESS_REQUIRED)
        if not lines:
            raise SaleException(SaleExceptionInfo.EMPTY_SALE_LINES)

        processed_lines: list[dict] = []
        requested_qty_by_product: dict[int, int] = defaultdict(int)
        products_by_id: dict[int, object] = {}
        subtotal = Decimal("0")

        for line in lines:
            product_id = line["product_id"]
            quantity = line["quantity"]
            product = products_by_id.get(product_id)
            if product is None:
                product = await self._product_reader.get_by_id(product_id)
                if product is None:
                    raise SaleException(SaleExceptionInfo.PRODUCT_NOT_FOUND)
                products_by_id[product_id] = product

            if not product.is_active:
                raise SaleException(SaleExceptionInfo.PRODUCT_NOT_ACTIVE)

            unit_price = Decimal(str(product.price))
            discount = Decimal(str(line.get("discount", "0")))
            vat_rate = product.vat_rate
            line_subtotal = quantity * unit_price * (1 - discount)
            line_tax = line_subtotal * vat_rate
            subtotal += line_subtotal
            requested_qty_by_product[product_id] += quantity

            processed_lines.append(
                {
                    "product_id": product_id,
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "discount": discount,
                    "vat_rate": vat_rate,
                    "line_subtotal": line_subtotal,
                    "line_tax": line_tax,
                }
            )

        for product_id, quantity in requested_qty_by_product.items():
            available = await self._stock_reader.get_available_stock(
                sale.warehouse_id, product_id
            )
            if available < quantity:
                raise SaleException(SaleExceptionInfo.INSUFFICIENT_STOCK)

        taxes = sum((line["line_tax"] for line in processed_lines), Decimal("0"))
        total = subtotal + taxes

        updated_sale = await self._sale_repo.update(
            sale_id=sale_id,
            client_id=client_id,
            delivery_address=delivery_address.strip(),
            subtotal=subtotal,
            taxes=taxes,
            total=total,
            lines=processed_lines,
        )

        creator_name = await self._user_reader.get_name_by_id(updated_sale.user_id)
        client_name = await self._client_reader.get_name_by_id(updated_sale.client_id)
        setattr(updated_sale, "creator_name", creator_name)
        setattr(updated_sale, "client_name", client_name)

        return updated_sale

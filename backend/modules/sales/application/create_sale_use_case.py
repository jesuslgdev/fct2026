from collections import defaultdict
from decimal import Decimal

from modules.sales.application._discount import normalize_discount_to_rate
from modules.sales.domain.entities.sale import Sale
from modules.sales.domain.exceptions import (
    InsufficientStockForLineError,
    SaleException,
    SaleExceptionInfo,
)
from modules.sales.domain.interfaces.repositories.i_sale_repository import (
    ISaleRepository,
)
from modules.sales.domain.interfaces.use_cases.i_create_sale_use_case import (
    ICreateSaleUseCase,
)
from modules.sales.domain.sale_status import PENDING
from shared.domain.interfaces.i_client_reader import IClientReader
from shared.domain.interfaces.i_product_reader import IProductReader
from shared.domain.interfaces.i_stock_availability_reader import (
    IStockAvailabilityReader,
)
from shared.domain.interfaces.i_user_reader import IUserReader
from shared.domain.interfaces.i_warehouse_reader import IWarehouseReader


class CreateSaleUseCase(ICreateSaleUseCase):
    def __init__(
        self,
        sale_repo: ISaleRepository,
        client_reader: IClientReader,
        product_reader: IProductReader,
        warehouse_reader: IWarehouseReader,
        stock_reader: IStockAvailabilityReader,
        user_reader: IUserReader,
    ) -> None:
        self._sale_repo = sale_repo
        self._client_reader = client_reader
        self._product_reader = product_reader
        self._warehouse_reader = warehouse_reader
        self._stock_reader = stock_reader
        self._user_reader = user_reader

    async def execute(
        self,
        client_id: int,
        warehouse_id: int,
        user_id: int,
        lines: list[dict],
    ) -> Sale:
        client = await self._client_reader.get_by_id(client_id)
        if client is None:
            raise SaleException(SaleExceptionInfo.CLIENT_NOT_FOUND)
        if not client.is_active:
            raise SaleException(SaleExceptionInfo.CLIENT_NOT_ACTIVE)

        warehouse = await self._warehouse_reader.get_by_id(warehouse_id)
        if warehouse is None:
            raise SaleException(SaleExceptionInfo.WAREHOUSE_NOT_FOUND)

        delivery_address = (
            f"{client.street}, {client.city}, {client.province}, {client.postal_code}"
        )

        if not lines:
            raise SaleException(SaleExceptionInfo.EMPTY_SALE_LINES)

        products_by_id: dict[int, object] = {}
        requested_qty_by_product: dict[int, int] = defaultdict(int)

        for line in lines:
            product_id = line["product_id"]
            if product_id not in products_by_id:
                product = await self._product_reader.get_by_id(product_id)
                if product is None:
                    raise SaleException(SaleExceptionInfo.PRODUCT_NOT_FOUND)
                if not product.is_active:
                    raise SaleException(SaleExceptionInfo.PRODUCT_NOT_ACTIVE)
                products_by_id[product_id] = product
            requested_qty_by_product[product_id] += line["quantity"]

        for product_id, total_qty in requested_qty_by_product.items():
            available = await self._stock_reader.get_available_stock(
                warehouse_id, product_id
            )
            if available < total_qty:
                first_index = next(
                    i for i, ln in enumerate(lines) if ln["product_id"] == product_id
                )
                raise InsufficientStockForLineError(first_index)

        processed_lines: list[dict] = []
        subtotal = Decimal("0")

        for line in lines:
            product = products_by_id[line["product_id"]]
            quantity = line["quantity"]
            unit_price = Decimal(str(product.price))
            discount_rate = normalize_discount_to_rate(
                Decimal(str(line.get("discount", "0"))),
                line.get("discount_type", "percent"),
                unit_price,
                quantity,
            )
            vat_rate = product.vat_rate
            line_subtotal = quantity * unit_price * (1 - discount_rate)
            line_tax = line_subtotal * vat_rate
            subtotal += line_subtotal

            processed_lines.append(
                {
                    "product_id": line["product_id"],
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "discount": discount_rate,
                    "vat_rate": vat_rate,
                    "line_subtotal": line_subtotal,
                    "line_tax": line_tax,
                }
            )

        taxes = sum(pl["line_tax"] for pl in processed_lines)
        total = subtotal + taxes

        sale_number = await self._sale_repo.generate_sale_number()

        sale = await self._sale_repo.create(
            sale_number=sale_number,
            client_id=client_id,
            warehouse_id=warehouse_id,
            delivery_address=delivery_address,
            user_id=user_id,
            status=PENDING,
            subtotal=subtotal,
            taxes=taxes,
            total=total,
            lines=processed_lines,
        )

        creator_name = await self._user_reader.get_name_by_id(user_id)
        client_name = await self._client_reader.get_name_by_id(client_id)
        setattr(sale, "creator_name", creator_name)
        setattr(sale, "client_name", client_name)

        return sale

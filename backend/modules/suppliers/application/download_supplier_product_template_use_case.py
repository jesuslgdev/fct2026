from io import BytesIO

from openpyxl import Workbook

from modules.suppliers.domain.exceptions import (
    SupplierException,
    SupplierExceptionInfo,
)
from modules.suppliers.domain.interfaces.use_cases.i_download_supplier_product_template_use_case import (
    IDownloadSupplierProductTemplateUseCase,
)
from shared.domain.interfaces.i_product_reader import IProductReader


class DownloadSupplierProductTemplateUseCase(IDownloadSupplierProductTemplateUseCase):
    HEADERS = ("Código Producto", "Precio Proveedor", "Nombre Producto")
    EXAMPLE = ("PROD-001", "25.50", "Producto de ejemplo")

    def __init__(self, product_reader: IProductReader) -> None:
        self._product_reader = product_reader

    async def execute(self, product_ids: list[int] | None = None) -> bytes:
        wb = Workbook()
        ws = wb.active
        ws.title = "SupplierProducts"

        # Add headers
        ws.append(list(self.HEADERS))

        selected_products = await self._resolve_products(product_ids)
        if selected_products:
            for product_code, product_name in selected_products:
                ws.append([product_code, None, product_name])
        else:
            # Keep an example row when no products are selected.
            ws.append(list(self.EXAMPLE))

        with BytesIO() as buffer:
            wb.save(buffer)
            return buffer.getvalue()

    async def _resolve_products(
        self, product_ids: list[int] | None
    ) -> list[tuple[str, str]]:
        if not product_ids:
            return []

        deduplicated_ids: list[int] = []
        seen_ids: set[int] = set()
        for product_id in product_ids:
            if product_id not in seen_ids:
                seen_ids.add(product_id)
                deduplicated_ids.append(product_id)

        selected_products: list[tuple[str, str]] = []
        for product_id in deduplicated_ids:
            product = await self._product_reader.get_by_id(product_id)
            if product is None:
                raise SupplierException(SupplierExceptionInfo.PRODUCT_NOT_FOUND)
            if not product.is_active:
                raise SupplierException(SupplierExceptionInfo.PRODUCT_NOT_ACTIVE)
            selected_products.append((product.product_code, product.name))

        return selected_products

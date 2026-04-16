from io import BytesIO

from openpyxl import Workbook

from modules.suppliers.domain.exceptions import SupplierException, SupplierExceptionInfo
from modules.suppliers.domain.interfaces.use_cases.i_download_supplier_product_template_use_case import (
    IDownloadSupplierProductTemplateUseCase,
)
from shared.domain.interfaces.i_product_reader import IProductReader


class DownloadSupplierProductTemplateUseCase(IDownloadSupplierProductTemplateUseCase):
    HEADERS = ("Código Producto", "Precio Proveedor")
    EXAMPLE = ("PROD-001", "25.50")

    def __init__(self, product_reader: IProductReader) -> None:
        self._product_reader = product_reader

    async def execute(self, product_ids: list[int] | None = None) -> bytes:
        wb = Workbook()
        ws = wb.active
        ws.title = "SupplierProducts"

        # Add headers
        ws.append(list(self.HEADERS))

        product_codes = await self._resolve_product_codes(product_ids)
        if product_codes:
            for product_code in product_codes:
                ws.append([product_code, None])
        else:
            # Keep an example row when no products are selected.
            ws.append(list(self.EXAMPLE))

        with BytesIO() as buffer:
            wb.save(buffer)
            return buffer.getvalue()

    async def _resolve_product_codes(self, product_ids: list[int] | None) -> list[str]:
        if not product_ids:
            return []

        deduplicated_ids: list[int] = []
        seen_ids: set[int] = set()
        for product_id in product_ids:
            if product_id not in seen_ids:
                seen_ids.add(product_id)
                deduplicated_ids.append(product_id)

        product_codes: list[str] = []
        for product_id in deduplicated_ids:
            product = await self._product_reader.get_by_id(product_id)
            if product is None:
                raise SupplierException(SupplierExceptionInfo.PRODUCT_NOT_FOUND)
            if not product.is_active:
                raise SupplierException(SupplierExceptionInfo.PRODUCT_NOT_ACTIVE)
            product_codes.append(product.product_code)

        return product_codes

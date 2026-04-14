from io import BytesIO

from openpyxl import Workbook

from modules.suppliers.domain.interfaces.use_cases.i_download_supplier_product_template_use_case import (
    IDownloadSupplierProductTemplateUseCase,
)


class DownloadSupplierProductTemplateUseCase(IDownloadSupplierProductTemplateUseCase):
    HEADERS = ("Código Producto", "Precio Proveedor")
    EXAMPLE = ("PROD-001", "25.50")

    def execute(self) -> bytes:
        wb = Workbook()
        ws = wb.active
        ws.title = "SupplierProducts"

        # Add headers
        ws.append(list(self.HEADERS))

        # Add example row
        ws.append(list(self.EXAMPLE))

        with BytesIO() as buffer:
            wb.save(buffer)
            return buffer.getvalue()

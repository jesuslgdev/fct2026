from decimal import Decimal, InvalidOperation
from io import BytesIO

from openpyxl import load_workbook

from modules.suppliers.domain.entities.import_result import ImportResult, ImportRowError
from modules.suppliers.domain.entities.supplier_product import SupplierProduct
from modules.suppliers.domain.exceptions import SupplierException, SupplierExceptionInfo
from modules.suppliers.domain.interfaces.repositories.i_supplier_repository import (
    ISupplierRepository,
)
from modules.suppliers.domain.interfaces.use_cases.i_import_supplier_products_use_case import (
    IImportSupplierProductsUseCase,
)
from shared.domain.interfaces.i_product_reader import IProductReader


class ImportSupplierProductsUseCase(IImportSupplierProductsUseCase):
    HEADERS = ("Código Producto", "Precio Proveedor")

    def __init__(
        self, repo: ISupplierRepository, product_reader: IProductReader
    ) -> None:
        self._repo = repo
        self._product_reader = product_reader

    async def execute(self, supplier_id: int, file_content: bytes) -> ImportResult:
        # 1. Check supplier exists and is active
        supplier = await self._repo.get_by_id(supplier_id)
        if not supplier:
            raise SupplierException(SupplierExceptionInfo.SUPPLIER_NOT_FOUND)
        if not supplier.is_active:
            raise SupplierException(SupplierExceptionInfo.SUPPLIER_NOT_ACTIVE)

        try:
            wb = load_workbook(filename=BytesIO(file_content), data_only=True)
            ws = wb.active
            rows = list(ws.iter_rows(values_only=True))
        except Exception:
            return ImportResult(
                total=0,
                created=0,
                errors=[ImportRowError(row=0, reason="Invalid Excel file")],
            )

        if not rows:
            return ImportResult(
                total=0, created=0, errors=[ImportRowError(row=0, reason="Empty file")]
            )

        # Validate headers
        header_row = rows[0]
        if not header_row or list(header_row[:2]) != list(self.HEADERS):
            return ImportResult(
                total=0,
                created=0,
                errors=[
                    ImportRowError(
                        row=1,
                        reason="Invalid headers. Expected: Código Producto, Precio Proveedor",
                    )
                ],
            )

        data_rows = rows[1:]
        total = len(data_rows)
        created = 0
        errors: list[ImportRowError] = []
        to_create: list[SupplierProduct] = []
        seen_product_codes: set[str] = set()

        for i, row in enumerate(data_rows, start=2):
            if not any(row):  # Skip empty rows
                total -= 1
                continue

            product_code = str(row[0]).strip() if row[0] else None
            price_val = row[1]

            # Basic validation
            if not product_code:
                errors.append(ImportRowError(row=i, reason="Product code is required"))
                continue
            if price_val is None:
                errors.append(ImportRowError(row=i, reason="Price is required"))
                continue

            # Duplicate in file
            if product_code in seen_product_codes:
                errors.append(
                    ImportRowError(
                        row=i, reason=f"Duplicate product code in file: {product_code}"
                    )
                )
                continue
            seen_product_codes.add(product_code)

            # Price validation
            try:
                price = Decimal(str(price_val))
                if price <= 0:
                    errors.append(
                        ImportRowError(row=i, reason="Price must be greater than zero")
                    )
                    continue
                # Check max 2 decimals
                if price.as_tuple().exponent < -2:
                    errors.append(
                        ImportRowError(
                            row=i, reason="Price cannot have more than 2 decimal places"
                        )
                    )
                    continue
            except (InvalidOperation, ValueError):
                errors.append(ImportRowError(row=i, reason="Invalid price format"))
                continue

            # Product validation
            product = await self._product_reader.get_by_code(product_code)
            if not product:
                errors.append(
                    ImportRowError(
                        row=i, reason=f"Product with code {product_code} not found"
                    )
                )
                continue
            if not product.is_active:
                errors.append(
                    ImportRowError(
                        row=i, reason=f"Product {product_code} is not active"
                    )
                )
                continue

            # Existing association
            existing = await self._repo.get_association(supplier_id, product.product_id)
            if existing:
                errors.append(
                    ImportRowError(
                        row=i,
                        reason=f"Association already exists for product {product_code}",
                    )
                )
                continue

            to_create.append(
                SupplierProduct(
                    supplier_id=supplier_id,
                    product_id=product.product_id,
                    supplier_price=price,
                )
            )

        if not errors and to_create:
            created = await self._repo.bulk_create_products(to_create)

        return ImportResult(total=total, created=created, errors=errors)

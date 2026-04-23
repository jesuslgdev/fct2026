import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SupplierProductRepository } from '@domain/repositories/supplier-product.repository';
import { ImportSupplierProductsRequest, ImportResult } from '@domain/models/supplier-product.model';
import { SupplierProductValidationError } from '@domain/models/supplier-product-errors';

@Injectable({ providedIn: 'root' })
export class ImportSupplierProductsUseCase {
  private static readonly ALLOWED_FILE_EXTENSIONS = ['.xls', '.xlsx'];

  private readonly supplierProductRepository = inject(SupplierProductRepository);

  execute(supplierId: number, request: ImportSupplierProductsRequest): Observable<ImportResult> {
    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      throw new SupplierProductValidationError({ supplierId }, 'Invalid supplier ID.');
    }

    if (!request.file) {
      throw new SupplierProductValidationError({ file: null }, 'Excel file is required for import.');
    }

    if (!this.isExcelFile(request.file)) {
      throw new SupplierProductValidationError(
        { file: request.file.name },
        'Only Excel files (.xls, .xlsx) are allowed for import.'
      );
    }

    return this.supplierProductRepository.importSupplierProducts(supplierId, request);
  }

  private isExcelFile(file: File): boolean {
    const fileName = file.name.trim().toLowerCase();
    return ImportSupplierProductsUseCase.ALLOWED_FILE_EXTENSIONS.some((extension) => fileName.endsWith(extension));
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SupplierProductRepository } from '@domain/repositories/supplier-product.repository';
import { ImportSupplierProductsRequest, ImportResult } from '@domain/models/supplier-product.model';
import { SupplierProductValidationError } from '@domain/models/supplier-product-errors';

@Injectable({ providedIn: 'root' })
export class ImportSupplierProductsUseCase {
  private readonly supplierProductRepository = inject(SupplierProductRepository);

  execute(supplierId: number, request: ImportSupplierProductsRequest): Observable<ImportResult> {
    if (supplierId <= 0) {
      throw new SupplierProductValidationError({ supplierId }, 'Invalid supplier ID.');
    }

    if (!request.file) {
      throw new SupplierProductValidationError({ file: null }, 'Excel file is required for import.');
    }

    return this.supplierProductRepository.importSupplierProducts(supplierId, request);
  }
}

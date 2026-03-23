import { Injectable, inject } from '@angular/core';
import { SupplierProductRepository } from '@domain/repositories/supplier-product.repository';
import { ImportSupplierProductsRequest, ImportResult } from '@domain/models/supplier-product.model';

@Injectable({ providedIn: 'root' })
export class ImportSupplierProductsUseCase {
  private readonly supplierProductRepository = inject(SupplierProductRepository);

  execute(supplierId: string, request: ImportSupplierProductsRequest): Promise<ImportResult> {
    return this.supplierProductRepository.importSupplierProducts(supplierId, request);
  }
}

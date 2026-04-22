import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SupplierProductRepository } from '@domain/repositories/supplier-product.repository';
import { SupplierProductValidationError } from '@domain/models/supplier-product-errors';

@Injectable({ providedIn: 'root' })
export class DownloadTemplateUseCase {
  private readonly supplierProductRepository = inject(SupplierProductRepository);

  execute(supplierId: number): Observable<Blob> {
    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      throw new SupplierProductValidationError({ supplierId }, 'Invalid supplier ID.');
    }
    return this.supplierProductRepository.downloadTemplate(supplierId);
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SupplierProductRepository } from '@domain/repositories/supplier-product.repository';
import { SupplierProductValidationError } from '@domain/models/supplier-product-errors';

@Injectable({ providedIn: 'root' })
export class RemoveProductFromSupplierUseCase {
  private readonly supplierProductRepository = inject(SupplierProductRepository);

  execute(supplierId: number, productId: number): Observable<void> {
    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      throw new SupplierProductValidationError({ supplierId }, 'Invalid supplier ID.');
    }

    if (!Number.isInteger(productId) || productId <= 0) {
      throw new SupplierProductValidationError({ productId }, 'Invalid product ID.');
    }

    return this.supplierProductRepository.removeProductFromSupplier(supplierId, productId);
  }
}

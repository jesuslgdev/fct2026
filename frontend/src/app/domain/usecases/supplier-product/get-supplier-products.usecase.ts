import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SupplierProductRepository } from '@domain/repositories/supplier-product.repository';
import { SupplierProduct } from '@domain/models/supplier-product.model';
import { SupplierProductValidationError } from '@domain/models/supplier-product-errors';

@Injectable({ providedIn: 'root' })
export class GetSupplierProductsUseCase {
  private readonly supplierProductRepository = inject(SupplierProductRepository);

  execute(supplierId: number): Observable<SupplierProduct[]> {
    if (supplierId <= 0) {
      throw new SupplierProductValidationError({ supplierId }, 'Invalid supplier ID.');
    }

    return this.supplierProductRepository.getSupplierProducts(supplierId);
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SupplierProductRepository } from '@domain/repositories/supplier-product.repository';
import { UpdateSupplierProductPriceRequest, SupplierProduct } from '@domain/models/supplier-product.model';
import { SupplierProductValidationError } from '@domain/models/supplier-product-errors';

@Injectable({ providedIn: 'root' })
export class UpdateSupplierProductPriceUseCase {
  private readonly supplierProductRepository = inject(SupplierProductRepository);

  execute(supplierId: number, productId: number, request: UpdateSupplierProductPriceRequest): Observable<SupplierProduct> {
    if (supplierId <= 0) {
      throw new SupplierProductValidationError({ supplierId }, 'Invalid supplier ID.');
    }

    if (productId <= 0) {
      throw new SupplierProductValidationError({ productId }, 'Invalid product ID.');
    }

    if (request.supplierPrice <= 0) {
      throw new SupplierProductValidationError({ supplierPrice: request.supplierPrice }, 'Supplier price must be greater than zero.');
    }

    return this.supplierProductRepository.updateSupplierProductPrice(supplierId, productId, request);
  }
}

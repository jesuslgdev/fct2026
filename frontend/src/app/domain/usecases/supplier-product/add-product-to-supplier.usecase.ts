import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SupplierProductRepository } from '@domain/repositories/supplier-product.repository';
import { AddSupplierProductRequest, SupplierProduct } from '@domain/models/supplier-product.model';
import { SupplierProductValidationError } from '@domain/models/supplier-product-errors';

@Injectable({ providedIn: 'root' })
export class AddProductToSupplierUseCase {
  private readonly supplierProductRepository = inject(SupplierProductRepository);

  execute(supplierId: number, request: AddSupplierProductRequest): Observable<SupplierProduct> {
    if (supplierId <= 0) {
      throw new SupplierProductValidationError({ supplierId }, 'Invalid supplier ID.');
    }

    if (request.productId <= 0) {
      throw new SupplierProductValidationError({ productId: request.productId }, 'Invalid product ID.');
    }

    if (request.supplierPrice <= 0) {
      throw new SupplierProductValidationError({ supplierPrice: request.supplierPrice }, 'Supplier price must be greater than zero.');
    }

    return this.supplierProductRepository.addProductToSupplier(supplierId, request);
  }
}

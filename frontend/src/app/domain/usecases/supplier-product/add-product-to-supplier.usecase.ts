import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SupplierProductRepository } from '@domain/repositories/supplier-product.repository';
import { AddSupplierProductRequest, SupplierProduct } from '@domain/models/supplier-product.model';
import { SupplierProductValidationError } from '@domain/models/supplier-product-errors';

@Injectable({ providedIn: 'root' })
export class AddProductToSupplierUseCase {
  private readonly supplierProductRepository = inject(SupplierProductRepository);

  private hasMaxTwoDecimalPlaces(value: number): boolean {
    const normalized = value.toString();
    if (normalized.includes('e') || normalized.includes('E')) {
      return Number.isInteger(value * 100);
    }

    const decimalPart = normalized.split('.')[1] ?? '';
    return decimalPart.length <= 2;
  }

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

    if (!this.hasMaxTwoDecimalPlaces(request.supplierPrice)) {
      throw new SupplierProductValidationError({ supplierPrice: request.supplierPrice }, 'Supplier price must have maximum 2 decimal places.');
    }

    return this.supplierProductRepository.addProductToSupplier(supplierId, request);
  }
}

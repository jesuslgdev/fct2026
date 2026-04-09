import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SupplierProductRepository } from '@domain/repositories/supplier-product.repository';
import { UpdateSupplierProductPriceRequest, SupplierProduct } from '@domain/models/supplier-product.model';
import { SupplierProductValidationError } from '@domain/models/supplier-product-errors';

@Injectable({ providedIn: 'root' })
export class UpdateSupplierProductPriceUseCase {
  private readonly supplierProductRepository = inject(SupplierProductRepository);

  private hasMaxTwoDecimalPlaces(value: number): boolean {
    const normalized = value.toString();
    if (normalized.includes('e') || normalized.includes('E')) {
      return Number.isInteger(value * 100);
    }

    const decimalPart = normalized.split('.')[1] ?? '';
    return decimalPart.length <= 2;
  }

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

    if (!this.hasMaxTwoDecimalPlaces(request.supplierPrice)) {
      throw new SupplierProductValidationError({ supplierPrice: request.supplierPrice }, 'Supplier price must have maximum 2 decimal places.');
    }

    return this.supplierProductRepository.updateSupplierProductPrice(supplierId, productId, request);
  }
}

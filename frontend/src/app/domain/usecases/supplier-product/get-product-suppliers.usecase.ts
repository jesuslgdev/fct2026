import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SupplierProductRepository } from '@domain/repositories/supplier-product.repository';
import { ProductSupplier, PagedResult, ProductSupplierQueryParams } from '@domain/models/supplier-product.model';
import { SupplierProductValidationError } from '@domain/models/supplier-product-errors';

@Injectable({ providedIn: 'root' })
export class GetProductSuppliersUseCase {
  private readonly supplierProductRepository = inject(SupplierProductRepository);

  execute(productId: number, params?: ProductSupplierQueryParams): Observable<PagedResult<ProductSupplier>> {
    if (productId <= 0) {
      throw new SupplierProductValidationError({ productId }, 'Invalid product ID.');
    }

    const queryParams: ProductSupplierQueryParams = params || { page: 1, pageSize: 10 };

    if (queryParams.page < 1) {
      throw new SupplierProductValidationError({ page: queryParams.page }, 'Page must be greater than 0.');
    }
    if (queryParams.pageSize < 1 || queryParams.pageSize > 100) {
      throw new SupplierProductValidationError({ pageSize: queryParams.pageSize }, 'Page size must be between 1 and 100.');
    }

    return this.supplierProductRepository.getProductSuppliers(productId, queryParams);
  }
}

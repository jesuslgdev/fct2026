import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SupplierProductRepository } from '@domain/repositories/supplier-product.repository';
import { SupplierProduct, PagedResult, SupplierProductQueryParams } from '@domain/models/supplier-product.model';
import { SupplierProductValidationError } from '@domain/models/supplier-product-errors';

@Injectable({ providedIn: 'root' })
export class GetSupplierProductsUseCase {
  private readonly supplierProductRepository = inject(SupplierProductRepository);

  execute(supplierId: number, params?: SupplierProductQueryParams): Observable<PagedResult<SupplierProduct>> {
    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      throw new SupplierProductValidationError({ supplierId }, 'Invalid supplier ID.');
    }

    const queryParams: SupplierProductQueryParams = params || { page: 1, pageSize: 10 };

    if (!Number.isInteger(queryParams.page) || queryParams.page < 1) {
      throw new SupplierProductValidationError({ page: queryParams.page }, 'Page must be greater than 0.');
    }
    if (!Number.isInteger(queryParams.pageSize) || queryParams.pageSize < 1 || queryParams.pageSize > 100) {
      throw new SupplierProductValidationError({ pageSize: queryParams.pageSize }, 'Page size must be between 1 and 100.');
    }

    return this.supplierProductRepository.getSupplierProducts(supplierId, queryParams);
  }
}

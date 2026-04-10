import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { StockDistributionRepository } from '@domain/repositories/stock-distribution.repository';
import {
  StockDistributionFilters,
  StockDistributionListResult,
} from '@domain/models/stock-distribution.model';
import { StockDistributionValidationError } from '@domain/models/stock-distribution-errors';

@Injectable({
  providedIn: 'root',
})
export class GetStockDistributionUseCase {
  private readonly stockDistributionRepository = inject(
    StockDistributionRepository
  );

  execute(filters?: StockDistributionFilters): Observable<StockDistributionListResult> {
    const page =
      filters?.page !== undefined && Number.isInteger(filters.page) && filters.page > 0
        ? filters.page
        : 1;
    const pageSize =
      filters?.pageSize !== undefined &&
      Number.isInteger(filters.pageSize) &&
      filters.pageSize > 0
        ? filters.pageSize
        : 20;

    if (
      filters?.warehouseId !== undefined &&
      (!Number.isInteger(filters.warehouseId) || filters.warehouseId <= 0)
    ) {
      throw new StockDistributionValidationError(
        { field: 'warehouseId' },
        'Warehouse id must be a positive integer.',
      );
    }

    if (
      filters?.productId !== undefined &&
      (!Number.isInteger(filters.productId) || filters.productId <= 0)
    ) {
      throw new StockDistributionValidationError(
        { field: 'productId' },
        'Product id must be a positive integer.',
      );
    }

    const productName = filters?.productName?.trim();

    if (productName !== undefined && productName.length > 255) {
      throw new StockDistributionValidationError(
        { field: 'productName' },
        'Product name filter cannot exceed 255 characters.',
      );
    }

    const normalizedFilters: StockDistributionFilters = {
      page,
      pageSize,
      ...(filters?.warehouseId !== undefined ? { warehouseId: filters.warehouseId } : {}),
      ...(filters?.productId !== undefined ? { productId: filters.productId } : {}),
      ...(productName ? { productName } : {}),
    };

    return this.stockDistributionRepository.getStockDistribution(normalizedFilters);
  }
}

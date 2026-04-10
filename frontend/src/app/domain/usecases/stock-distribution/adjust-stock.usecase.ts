import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { StockDistributionRepository } from '@domain/repositories/stock-distribution.repository';
import {
  AdjustStockPayload,
  AdjustStockResult,
} from '@domain/models/stock-distribution.model';
import {
  InvalidQuantityError,
  ReasonTooLongError,
  StockDistributionValidationError,
} from '@domain/models/stock-distribution-errors';

@Injectable({
  providedIn: 'root',
})
export class AdjustStockUseCase {
  private readonly stockDistributionRepository = inject(
    StockDistributionRepository
  );

  execute(payload: AdjustStockPayload): Observable<AdjustStockResult> {
    const trimmedPayload: AdjustStockPayload = {
      warehouseId: payload.warehouseId,
      productId: payload.productId,
      newQuantity: payload.newQuantity,
      reason: payload.reason?.trim() || undefined,
    };

    if (!Number.isInteger(trimmedPayload.warehouseId) || trimmedPayload.warehouseId <= 0) {
      throw new StockDistributionValidationError(
        { field: 'warehouseId' },
        'Warehouse id must be a positive integer.',
      );
    }

    if (!Number.isInteger(trimmedPayload.productId) || trimmedPayload.productId <= 0) {
      throw new StockDistributionValidationError(
        { field: 'productId' },
        'Product id must be a positive integer.',
      );
    }

    if (!Number.isInteger(trimmedPayload.newQuantity) || trimmedPayload.newQuantity < 0) {
      throw new InvalidQuantityError();
    }

    if (trimmedPayload.reason && trimmedPayload.reason.length > 300) {
      throw new ReasonTooLongError();
    }

    return this.stockDistributionRepository.adjustStock(trimmedPayload);
  }
}

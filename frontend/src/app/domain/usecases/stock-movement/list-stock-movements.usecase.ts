import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PagedResult } from '@domain/models/paged-result.model';
import { StockMovement, ListStockMovementsPayload } from '@domain/models/stock-movement.model';
import { StockMovementRepository } from '@domain/repositories/stock-movement.repository';

@Injectable({ providedIn: 'root' })
export class ListStockMovementsUseCase {
  private readonly repository = inject(StockMovementRepository);

  execute(
    payload: ListStockMovementsPayload,
    page: number,
    pageSize: number,
  ): Observable<PagedResult<StockMovement>> {
    return this.repository.listMovements(payload, page, pageSize);
  }
}

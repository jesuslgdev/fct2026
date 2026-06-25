import { Observable } from 'rxjs';
import { PagedResult } from '@domain/models/paged-result.model';
import {
  StockMovement,
  StockMovementDetail,
  ListStockMovementsPayload,
} from '@domain/models/stock-movement.model';

export abstract class StockMovementRepository {
  abstract listMovements(
    payload: ListStockMovementsPayload,
    page: number,
    pageSize: number,
  ): Observable<PagedResult<StockMovement>>;

  abstract getMovementById(movementId: number): Observable<StockMovementDetail>;
}

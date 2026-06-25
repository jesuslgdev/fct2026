import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { StockMovementDetail } from '@domain/models/stock-movement.model';
import { StockMovementRepository } from '@domain/repositories/stock-movement.repository';

@Injectable({ providedIn: 'root' })
export class GetStockMovementByIdUseCase {
  private readonly repository = inject(StockMovementRepository);

  execute(movementId: number): Observable<StockMovementDetail> {
    return this.repository.getMovementById(movementId);
  }
}

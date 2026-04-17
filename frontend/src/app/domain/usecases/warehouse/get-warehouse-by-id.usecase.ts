import { Injectable, inject } from '@angular/core';
import { WarehouseRepository } from '@domain/repositories/warehouse.repository';
import { Warehouse } from '@domain/models/warehouse.model';
import { Observable, throwError } from 'rxjs';
import { WarehouseValidationError } from '@domain/models/warehouse-errors';

@Injectable({
  providedIn: 'root',
})
export class GetWarehouseByIdUseCase {
  private readonly warehouseRepository = inject(WarehouseRepository);

  execute(warehouseId: number): Observable<Warehouse> {
    if (!Number.isInteger(warehouseId) || warehouseId <= 0) {
      return throwError(() => new WarehouseValidationError('warehouseId', 'Warehouse ID must be a positive integer.'));
    }

    return this.warehouseRepository.getWarehouseById(warehouseId);
  }
}

import { Injectable, inject } from '@angular/core';
import { WarehouseRepository } from '@domain/repositories/warehouse.repository';
import { Warehouse, UpdateWarehousePayload } from '@domain/models/warehouse.model';
import { Observable, throwError } from 'rxjs';
import { WarehouseValidationError } from '@domain/models/warehouse-errors';

@Injectable({
  providedIn: 'root',
})
export class UpdateWarehouseUseCase {
  private readonly warehouseRepository = inject(WarehouseRepository);

  execute(warehouseId: number, payload: UpdateWarehousePayload): Observable<Warehouse> {
    if (!Number.isInteger(warehouseId) || warehouseId <= 0) {
      return throwError(() => new WarehouseValidationError('warehouseId', 'The warehouse ID must be a positive integer.'));
    }

    const name = payload.name?.trim() ?? '';
    const address = payload.address?.trim() ?? '';

    if (name.length === 0) {
      return throwError(() => new WarehouseValidationError('name', 'The name is required.'));
    }
    if (name.length < 2 || name.length > 100) {
      return throwError(() => new WarehouseValidationError('name', 'The name must be between 2 and 100 characters.'));
    }
    if (address.length === 0) {
      return throwError(() => new WarehouseValidationError('address', 'The address is required.'));
    }
    if (address.length < 5 || address.length > 255) {
      return throwError(() => new WarehouseValidationError('address', 'The address must be between 5 and 255 characters.'));
    }

    return this.warehouseRepository.updateWarehouse(warehouseId, { name, address });
  }
}

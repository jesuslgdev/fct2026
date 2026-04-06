import { Injectable, inject } from '@angular/core';
import { WarehouseRepository } from '@domain/repositories/warehouse.repository';
import { Warehouse, CreateWarehousePayload } from '@domain/models/warehouse.model';
import { Observable, throwError } from 'rxjs';
import { WarehouseValidationError } from '@domain/models/warehouse-errors';

@Injectable({
  providedIn: 'root',
})
export class CreateWarehouseUseCase {
  private readonly warehouseRepository = inject(WarehouseRepository);

  execute(payload: CreateWarehousePayload): Observable<Warehouse> {
    const name = payload.name?.trim() ?? '';
    const address = payload.address?.trim() ?? '';

    if (name.length === 0) {
      return throwError(() => new WarehouseValidationError('name', 'El nombre es obligatorio.'));
    }
    if (name.length < 2 || name.length > 100) {
      return throwError(() => new WarehouseValidationError('name', 'El nombre debe tener entre 2 y 100 caracteres.'));
    }
    if (address.length === 0) {
      return throwError(() => new WarehouseValidationError('address', 'La dirección es obligatoria.'));
    }
    if (address.length < 5 || address.length > 255) {
      return throwError(() => new WarehouseValidationError('address', 'La dirección debe tener entre 5 y 255 caracteres.'));
    }

    return this.warehouseRepository.createWarehouse({ name, address });
  }
}

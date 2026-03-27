import { Injectable, inject } from '@angular/core';
import { WarehouseRepository } from '@domain/repositories/warehouse.repository';
import { Warehouse, CreateWarehousePayload } from '@domain/models/warehouse.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CreateWarehouseUseCase {
  private readonly warehouseRepository = inject(WarehouseRepository);

  execute(payload: CreateWarehousePayload): Observable<Warehouse> {
    return this.warehouseRepository.createWarehouse(payload);
  }
}

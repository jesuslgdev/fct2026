import { Injectable, inject } from '@angular/core';
import { WarehouseRepository } from '@domain/repositories/warehouse.repository';
import { Warehouse, CreateWarehousePayload } from '@domain/models/warehouse.model';

@Injectable({
  providedIn: 'root',
})
export class CreateWarehouseUseCase {
  private readonly warehouseRepository = inject(WarehouseRepository);

  execute(payload: CreateWarehousePayload): Promise<Warehouse> {
    return this.warehouseRepository.createWarehouse(payload);
  }
}

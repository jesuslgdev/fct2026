import { Injectable, inject } from '@angular/core';
import { WarehouseRepository } from '@domain/repositories/warehouse.repository';
import { Warehouse, UpdateWarehousePayload } from '@domain/models/warehouse.model';

@Injectable({
  providedIn: 'root',
})
export class UpdateWarehouseUseCase {
  private readonly warehouseRepository = inject(WarehouseRepository);

  execute(warehouseId: number, payload: UpdateWarehousePayload): Promise<Warehouse> {
    return this.warehouseRepository.updateWarehouse(warehouseId, payload);
  }
}

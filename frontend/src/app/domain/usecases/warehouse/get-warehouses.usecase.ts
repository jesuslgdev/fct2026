import { Injectable, inject } from '@angular/core';
import { WarehouseRepository } from '@domain/repositories/warehouse.repository';
import { WarehouseListResult } from '@domain/models/warehouse.model';

@Injectable({
  providedIn: 'root',
})
export class GetWarehousesUseCase {
  private readonly warehouseRepository = inject(WarehouseRepository);

  execute(): Promise<WarehouseListResult> {
    return this.warehouseRepository.getWarehouses();
  }
}

import { Injectable, inject } from '@angular/core';
import { WarehouseRepository } from '@domain/repositories/warehouse.repository';

@Injectable({
  providedIn: 'root',
})
export class DeleteWarehouseUseCase {
  private readonly warehouseRepository = inject(WarehouseRepository);

  execute(warehouseId: number): Promise<void> {
    return this.warehouseRepository.deleteWarehouse(warehouseId);
  }
}

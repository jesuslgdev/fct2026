import { Injectable, inject } from '@angular/core';
import { WarehouseRepository } from '@domain/repositories/warehouse.repository';

@Injectable({
  providedIn: 'root',
})
export class GetWarehouseTotalStockUseCase {
  private readonly warehouseRepository = inject(WarehouseRepository);

  execute(warehouseId: number): Promise<number> {
    return this.warehouseRepository.getWarehouseTotalStock(warehouseId);
  }
}

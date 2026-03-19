import { Injectable, inject } from '@angular/core';
import { WarehouseRepository } from '@domain/repositories/warehouse.repository';
import { Warehouse } from '@domain/models/warehouse.model';

@Injectable({
  providedIn: 'root',
})
export class GetWarehouseByNameUseCase {
  private readonly warehouseRepository = inject(WarehouseRepository);

  execute(name: string): Promise<Warehouse | null> {
    return this.warehouseRepository.getWarehouseByName(name);
  }
}

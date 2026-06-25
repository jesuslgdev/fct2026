import { Injectable, inject } from '@angular/core';
import { WarehouseRepository } from '@domain/repositories/warehouse.repository';
import { WarehouseListResult } from '@domain/models/warehouse.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GetWarehousesUseCase {
  private readonly warehouseRepository = inject(WarehouseRepository);

  execute(): Observable<WarehouseListResult> {
    return this.warehouseRepository.getWarehouses();
  }
}

import { Injectable, inject } from '@angular/core';
import { WarehouseRepository } from '@domain/repositories/warehouse.repository';
import { Warehouse } from '@domain/models/warehouse.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GetWarehouseByIdUseCase {
  private readonly warehouseRepository = inject(WarehouseRepository);

  execute(warehouseId: number): Observable<Warehouse> {
    return this.warehouseRepository.getWarehouseById(warehouseId);
  }
}

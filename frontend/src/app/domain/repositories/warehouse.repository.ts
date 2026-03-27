import { Observable } from 'rxjs';
import {
  Warehouse,
  CreateWarehousePayload,
  UpdateWarehousePayload,
  WarehouseListResult,
} from '@domain/models/warehouse.model';

export abstract class WarehouseRepository {
  abstract getWarehouses(): Observable<WarehouseListResult>;
  abstract getWarehouseById(warehouseId: number): Observable<Warehouse>;
  abstract createWarehouse(payload: CreateWarehousePayload): Observable<Warehouse>;
  abstract updateWarehouse(warehouseId: number, payload: UpdateWarehousePayload): Observable<Warehouse>;
  abstract deleteWarehouse(warehouseId: number): Observable<void>;
}

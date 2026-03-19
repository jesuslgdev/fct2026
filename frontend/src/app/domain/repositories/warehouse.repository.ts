import {
  Warehouse,
  CreateWarehousePayload,
  UpdateWarehousePayload,
  WarehouseListResult,
} from '@domain/models/warehouse.model';

export abstract class WarehouseRepository {
  abstract getWarehouses(): Promise<WarehouseListResult>;
  abstract getWarehouseById(warehouseId: number): Promise<Warehouse>;
  abstract getWarehouseByName(name: string): Promise<Warehouse | null>;
  abstract createWarehouse(payload: CreateWarehousePayload): Promise<Warehouse>;
  abstract updateWarehouse(warehouseId: number, payload: UpdateWarehousePayload): Promise<Warehouse>;
  abstract deleteWarehouse(warehouseId: number): Promise<void>;
  abstract getWarehouseTotalStock(warehouseId: number): Promise<number>;
}

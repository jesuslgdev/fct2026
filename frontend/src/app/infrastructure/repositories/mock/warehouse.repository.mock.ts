import { Injectable } from '@angular/core';
import { WarehouseRepository } from '@domain/repositories/warehouse.repository';
import { Warehouse,
  CreateWarehousePayload,
  UpdateWarehousePayload,
  WarehouseListResult,
} from '@domain/models/warehouse.model';
import {
  WarehouseAlreadyExistsError,
  WarehouseHasStockError,
  WarehouseNotFoundError,
} from '@domain/models/warehouse-errors';
const INITIAL_MOCK_WAREHOUSES: Warehouse[] = [
  {
    warehouseId: 1,
    name: 'Almacén Central',
    address: 'Calle Principal 123, Madrid',
    totalStock: 150,
  },
  {
    warehouseId: 2,
    name: 'Almacén Norte',
    address: 'Polígono Industrial 45, Barcelona',
    totalStock: 75,
  },
  {
    warehouseId: 3,
    name: 'Almacén Sur',
    address: 'Avenida de la Industria 789, Valencia',
    totalStock: 200,
  },
];

@Injectable()
export class MockWarehouseRepository implements WarehouseRepository {
  private warehouses: Warehouse[];

  constructor() {
    this.warehouses = INITIAL_MOCK_WAREHOUSES.map((w) => ({ ...w }));
  }

  private getWarehouseByIdOrThrow(warehouseId: number): Warehouse {
    const warehouse = this.warehouses.find((w) => w.warehouseId === warehouseId);
    if (!warehouse) throw new WarehouseNotFoundError();
    return warehouse;
  }

  private assertNameIsUnique(name: string, currentId?: number): void {
    const normalized = name.trim().toLowerCase();
    const duplicated = this.warehouses.some(
      (w) => w.warehouseId !== currentId && w.name.trim().toLowerCase() === normalized,
    );

    if (duplicated) {
      throw new WarehouseAlreadyExistsError();
    }
  }

  async getWarehouses(): Promise<WarehouseListResult> {
    return [...this.warehouses];
  }

  async getWarehouseById(warehouseId: number): Promise<Warehouse> {
    const warehouse = this.getWarehouseByIdOrThrow(warehouseId);
    return { ...warehouse };
  }

  async getWarehouseByName(name: string): Promise<Warehouse | null> {
    const warehouse = this.warehouses.find((w) => w.name.toLowerCase() === name.toLowerCase());
    return warehouse ? { ...warehouse } : null;
  }

  async createWarehouse(payload: CreateWarehousePayload): Promise<Warehouse> {
    this.assertNameIsUnique(payload.name);

    const nextId = Math.max(0, ...this.warehouses.map((w) => w.warehouseId)) + 1;
    const newWarehouse: Warehouse = {
      warehouseId: nextId,
      name: payload.name,
      address: payload.address,
      totalStock: 0,
    };
    this.warehouses = [...this.warehouses, newWarehouse];
    return { ...newWarehouse };
  }

  async updateWarehouse(warehouseId: number, payload: UpdateWarehousePayload): Promise<Warehouse> {
    const existing = this.getWarehouseByIdOrThrow(warehouseId);
    const nextName = payload.name ?? existing.name;
    this.assertNameIsUnique(nextName, warehouseId);

    const updated: Warehouse = {
      ...existing,
      ...(payload.name !== undefined && {
        name: payload.name ?? existing.name,
      }),
      ...(payload.address !== undefined && {
        address: payload.address ?? existing.address,
      }),
    };

    this.warehouses = this.warehouses.map((w) => (w.warehouseId === warehouseId ? updated : w));
    return { ...updated };
  }

  async deleteWarehouse(warehouseId: number): Promise<void> {
    const warehouse = this.getWarehouseByIdOrThrow(warehouseId);
    if (warehouse.totalStock > 0) {
      throw new WarehouseHasStockError();
    }

    this.warehouses = this.warehouses.filter((w) => w.warehouseId !== warehouseId);
  }

  async getWarehouseTotalStock(warehouseId: number): Promise<number> {
    const warehouse = this.getWarehouseByIdOrThrow(warehouseId);
    return warehouse.totalStock;
  }
}

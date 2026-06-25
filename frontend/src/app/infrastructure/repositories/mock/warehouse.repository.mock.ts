import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { WarehouseRepository } from '@domain/repositories/warehouse.repository';
import {
  Warehouse,
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
    name: 'Almacen Central',
    address: 'Calle Principal 123, Madrid, Madrid, 28001',
    addressData: {
      street: 'Calle Principal 123',
      city: 'Madrid',
      province: 'Madrid',
      postalCode: '28001',
    },
    totalStock: 150,
  },
  {
    warehouseId: 2,
    name: 'Almacen Norte',
    address: 'Poligono Industrial 45, Barcelona, Barcelona, 08001',
    addressData: {
      street: 'Poligono Industrial 45',
      city: 'Barcelona',
      province: 'Barcelona',
      postalCode: '08001',
    },
    totalStock: 75,
  },
  {
    warehouseId: 3,
    name: 'Almacen Sur',
    address: 'Avenida de la Industria 789, Valencia, Valencia, 46001',
    addressData: {
      street: 'Avenida de la Industria 789',
      city: 'Valencia',
      province: 'Valencia',
      postalCode: '46001',
    },
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

  private formatAddress(address: CreateWarehousePayload['address']): string {
    return [address.street, address.city, address.province, address.postalCode].join(', ');
  }

  getWarehouses(): Observable<WarehouseListResult> {
    return of([...this.warehouses]);
  }

  getWarehouseById(warehouseId: number): Observable<Warehouse> {
    try {
      const warehouse = this.getWarehouseByIdOrThrow(warehouseId);
      return of({ ...warehouse });
    } catch (e) {
      return throwError(() => e);
    }
  }

  createWarehouse(payload: CreateWarehousePayload): Observable<Warehouse> {
    try {
      this.assertNameIsUnique(payload.name);

      const nextId = Math.max(0, ...this.warehouses.map((w) => w.warehouseId)) + 1;
      const newWarehouse: Warehouse = {
        warehouseId: nextId,
        name: payload.name,
        address: this.formatAddress(payload.address),
        addressData: payload.address,
        totalStock: 0,
      };
      this.warehouses = [...this.warehouses, newWarehouse];
      return of({ ...newWarehouse });
    } catch (e) {
      return throwError(() => e);
    }
  }

  updateWarehouse(warehouseId: number, payload: UpdateWarehousePayload): Observable<Warehouse> {
    try {
      const existing = this.getWarehouseByIdOrThrow(warehouseId);
      const nextName = payload.name;
      this.assertNameIsUnique(nextName, warehouseId);

      const updated: Warehouse = {
        ...existing,
        name: payload.name,
        address: this.formatAddress(payload.address),
        addressData: payload.address,
      };

      this.warehouses = this.warehouses.map((w) => (w.warehouseId === warehouseId ? updated : w));
      return of({ ...updated });
    } catch (e) {
      return throwError(() => e);
    }
  }

  deleteWarehouse(warehouseId: number): Observable<void> {
    try {
      const warehouse = this.getWarehouseByIdOrThrow(warehouseId);
      if (warehouse.totalStock > 0) {
        throw new WarehouseHasStockError();
      }

      this.warehouses = this.warehouses.filter((w) => w.warehouseId !== warehouseId);
      return of(undefined);
    } catch (e) {
      return throwError(() => e);
    }
  }
}

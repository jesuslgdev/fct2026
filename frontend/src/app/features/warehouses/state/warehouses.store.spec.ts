import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { WarehousesStore } from '@features/warehouses/state/warehouses.store';
import { AuthService } from '@core/services/auth.service';
import { WarehouseRepository } from '@domain/repositories/warehouse.repository';
import {
  Warehouse,
  CreateWarehousePayload,
  UpdateWarehousePayload,
  WarehouseListResult,
} from '@domain/models/warehouse.model';
import {
  WarehouseForbiddenError,
  WarehouseValidationError,
} from '@domain/models/warehouse-errors';

const WAREHOUSE_A: Warehouse = {
  warehouseId: 1,
  name: 'Almacén Central',
  address: 'Calle Principal 123, Madrid',
  totalStock: 150,
};

const WAREHOUSE_B: Warehouse = {
  warehouseId: 2,
  name: 'Almacén Norte',
  address: 'Polígono Industrial 45, Barcelona',
  totalStock: 75,
};

class MockAuthService {
  readonly user = signal({
    uid: 'uid-1',
    email: 'admin@example.com',
    displayName: 'Admin',
    photoURL: null,
    role: 'Administrator' as const,
  });
}

class MockWarehouseRepository implements WarehouseRepository {
  getWarehouses = vi.fn<() => Promise<WarehouseListResult>>();
  getWarehouseById = vi.fn<(warehouseId: number) => Promise<Warehouse>>();
  getWarehouseByName = vi.fn<(name: string) => Promise<Warehouse | null>>();
  createWarehouse = vi.fn<(payload: CreateWarehousePayload) => Promise<Warehouse>>();
  updateWarehouse = vi.fn<(warehouseId: number, payload: UpdateWarehousePayload) => Promise<Warehouse>>();
  deleteWarehouse = vi.fn<(warehouseId: number) => Promise<void>>();
  getWarehouseTotalStock = vi.fn<(warehouseId: number) => Promise<number>>();
}

describe('WarehousesStore', () => {
  let store: WarehousesStore;
  let repo: MockWarehouseRepository;

  beforeEach(() => {
    repo = new MockWarehouseRepository();

    TestBed.configureTestingModule({
      providers: [
        WarehousesStore,
        { provide: AuthService, useValue: new MockAuthService() },
        { provide: WarehouseRepository, useValue: repo },
      ],
    });

    store = TestBed.inject(WarehousesStore);
  });

  it('loads warehouses successfully', async () => {
    const warehouses: Warehouse[] = [WAREHOUSE_A, WAREHOUSE_B];
    repo.getWarehouses.mockResolvedValueOnce(warehouses);

    await store.loadWarehouses();

    expect(repo.getWarehouses).toHaveBeenCalledOnce();
    expect(store.warehouses()).toEqual([WAREHOUSE_A, WAREHOUSE_B]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('sets error when loading warehouses fails', async () => {
    repo.getWarehouses.mockRejectedValueOnce(new Error('boom'));

    await store.loadWarehouses();

    expect(store.error()).toBe('Failed to load warehouses.');
    expect(store.loading()).toBe(false);
  });

  it('maps forbidden warehouse error to a specific message', async () => {
    repo.getWarehouses.mockRejectedValueOnce(new WarehouseForbiddenError());

    await store.loadWarehouses();

    expect(store.error()).toBe('You do not have permissions to perform this action.');
  });

  it('maps validation warehouse error to backend message', async () => {
    repo.createWarehouse.mockRejectedValueOnce(
      new WarehouseValidationError({ field: 'name' }, 'Name already exists.'),
    );

    await store.saveWarehouse({
      name: 'Almacén Central',
      address: 'Calle Principal 123',
    });

    expect(store.error()).toBe('Name already exists.');
  });

  it('creates a new warehouse and updates state', async () => {
    const payload: CreateWarehousePayload = {
      name: 'Almacén Sur',
      address: 'Avenida de la Industria 789, Valencia',
    };

    // Mock warehouse creation
    repo.createWarehouse.mockResolvedValueOnce(WAREHOUSE_B);

    store.openCreateDialog();
    await store.saveWarehouse(payload);

    expect(repo.createWarehouse).toHaveBeenCalledWith(payload);
    expect(store.warehouses()).toEqual([WAREHOUSE_B]);
    expect(store.dialogVisible()).toBe(false);
    expect(store.selectedWarehouse()).toBeNull();
  });

  it('updates an existing warehouse in edit mode', async () => {
    const updated: Warehouse = { ...WAREHOUSE_A, name: 'Almacén Principal' };
    const payload: UpdateWarehousePayload = { name: 'Almacén Principal' };
    const expectedPayload: UpdateWarehousePayload = {
      name: 'Almacén Principal',
      address: WAREHOUSE_A.address,
    };

    repo.getWarehouses.mockResolvedValueOnce([WAREHOUSE_A]);
    await store.loadWarehouses();

    // Mock warehouse update
    repo.updateWarehouse.mockResolvedValueOnce(updated);

    store.openEditDialog(WAREHOUSE_A);
    await store.saveWarehouse(payload);

    expect(repo.updateWarehouse).toHaveBeenCalledWith(WAREHOUSE_A.warehouseId, expectedPayload);
    expect(store.warehouses()).toEqual([updated]);
    expect(store.dialogVisible()).toBe(false);
  });

  it('deletes warehouse and closes confirm dialog', async () => {
    repo.getWarehouses.mockResolvedValueOnce([WAREHOUSE_A]);
    await store.loadWarehouses();

    // Mock warehouse deletion
    repo.deleteWarehouse.mockResolvedValueOnce();

    store.requestDeleteWarehouse(WAREHOUSE_A);
    await store.confirmDeleteWarehouse();

    expect(repo.deleteWarehouse).toHaveBeenCalledWith(WAREHOUSE_A.warehouseId);
    expect(store.warehouses()).toEqual([]);
    expect(store.confirmDialogVisible()).toBe(false);
    expect(store.warehouseToDelete()).toBeNull();
  });

  it('searches warehouse by name', async () => {
    repo.getWarehouseByName.mockResolvedValueOnce(WAREHOUSE_A);

    const result = await store.searchWarehouseByName('Almacén Central');

    expect(repo.getWarehouseByName).toHaveBeenCalledWith('Almacén Central');
    expect(result).toEqual(WAREHOUSE_A);
  });

  it('sets search query and triggers search', () => {
    const query = 'Almacén';
    store.onSearch(query);

    expect(store.searchQuery()).toBe(query);
  });

  it('opens create dialog correctly', () => {
    store.openCreateDialog();

    expect(store.dialogMode()).toBe('create');
    expect(store.dialogVisible()).toBe(true);
    expect(store.selectedWarehouse()).toBeNull();
  });

  it('opens edit dialog correctly', () => {
    store.openEditDialog(WAREHOUSE_A);

    expect(store.dialogMode()).toBe('edit');
    expect(store.dialogVisible()).toBe(true);
    expect(store.selectedWarehouse()).toEqual(WAREHOUSE_A);
  });

  it('closes dialog correctly', () => {
    store.openCreateDialog();
    store.closeDialog();

    expect(store.dialogVisible()).toBe(false);
    expect(store.selectedWarehouse()).toBeNull();
  });

  it('computes canEdit correctly', () => {
    expect(store.canEdit()).toBe(true);
  });
});

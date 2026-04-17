import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { WarehousesStore } from '@features/warehouses/state/warehouses.store';
import { AuthService } from '@core/services/auth.service';
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
import { UserPermission } from '@domain/enums/user-permission.enum';
import { GetWarehousesUseCase } from '@domain/usecases/warehouse/get-warehouses.usecase';
import { CreateWarehouseUseCase } from '@domain/usecases/warehouse/create-warehouse.usecase';
import { UpdateWarehouseUseCase } from '@domain/usecases/warehouse/update-warehouse.usecase';
import { DeleteWarehouseUseCase } from '@domain/usecases/warehouse/delete-warehouse.usecase';
import { Observable, of, throwError } from 'rxjs';

const ADDRESS_A = {
  street: 'Calle Principal 123',
  city: 'Madrid',
  province: 'Madrid',
  postalCode: '28001',
};

const ADDRESS_B = {
  street: 'Poligono Industrial 45',
  city: 'Barcelona',
  province: 'Barcelona',
  postalCode: '08001',
};

const WAREHOUSE_A: Warehouse = {
  warehouseId: 1,
  name: 'Almacen Central',
  address: 'Calle Principal 123, Madrid, Madrid, 28001',
  addressData: ADDRESS_A,
  totalStock: 150,
};

const WAREHOUSE_B: Warehouse = {
  warehouseId: 2,
  name: 'Almacen Norte',
  address: 'Poligono Industrial 45, Barcelona, Barcelona, 08001',
  addressData: ADDRESS_B,
  totalStock: 75,
};

class MockAuthService {
  readonly user = signal({
    uid: 'uid-1',
    email: 'admin@example.com',
    displayName: 'Admin',
    photoURL: null,
    role: 'Administrator' as const,
    permissions: [UserPermission.Admin],
  });
  readonly permissions = signal([UserPermission.Admin]);
  hasPermission(permission: UserPermission | UserPermission[]): boolean {
    const p = Array.isArray(permission) ? permission : [permission];
    return p.some((perm) => (this.permissions() as UserPermission[]).includes(perm));
  }
}

class MockGetWarehousesUseCase {
  execute = vi.fn<() => Observable<WarehouseListResult>>();
}

class MockCreateWarehouseUseCase {
  execute = vi.fn<(payload: CreateWarehousePayload) => Observable<Warehouse>>();
}

class MockUpdateWarehouseUseCase {
  execute = vi.fn<(warehouseId: number, payload: UpdateWarehousePayload) => Observable<Warehouse>>();
}

class MockDeleteWarehouseUseCase {
  execute = vi.fn<(warehouseId: number) => Observable<void>>();
}

describe('WarehousesStore', () => {
  let store: WarehousesStore;
  let getWarehousesUseCase: MockGetWarehousesUseCase;
  let createWarehouseUseCase: MockCreateWarehouseUseCase;
  let updateWarehouseUseCase: MockUpdateWarehouseUseCase;
  let deleteWarehouseUseCase: MockDeleteWarehouseUseCase;

  beforeEach(() => {
    getWarehousesUseCase = new MockGetWarehousesUseCase();
    createWarehouseUseCase = new MockCreateWarehouseUseCase();
    updateWarehouseUseCase = new MockUpdateWarehouseUseCase();
    deleteWarehouseUseCase = new MockDeleteWarehouseUseCase();

    TestBed.configureTestingModule({
      providers: [
        WarehousesStore,
        { provide: AuthService, useValue: new MockAuthService() },
        { provide: GetWarehousesUseCase, useValue: getWarehousesUseCase },
        { provide: CreateWarehouseUseCase, useValue: createWarehouseUseCase },
        { provide: UpdateWarehouseUseCase, useValue: updateWarehouseUseCase },
        { provide: DeleteWarehouseUseCase, useValue: deleteWarehouseUseCase },
      ],
    });

    store = TestBed.inject(WarehousesStore);
  });

  it('loads warehouses successfully', () => {
    const warehouses: Warehouse[] = [WAREHOUSE_A, WAREHOUSE_B];
    getWarehousesUseCase.execute.mockReturnValueOnce(of(warehouses));

    store.loadWarehouses();

    expect(getWarehousesUseCase.execute).toHaveBeenCalledOnce();
    expect(store.warehouses()).toEqual([WAREHOUSE_A, WAREHOUSE_B]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('sets error when loading warehouses fails', () => {
    getWarehousesUseCase.execute.mockReturnValueOnce(throwError(() => new Error('boom')));

    store.loadWarehouses();

    expect(store.error()).toBe('Error al cargar los almacenes.');
    expect(store.loading()).toBe(false);
  });

  it('maps forbidden warehouse error to a specific message', () => {
    getWarehousesUseCase.execute.mockReturnValueOnce(throwError(() => new WarehouseForbiddenError()));

    store.loadWarehouses();

    expect(store.error()).toBe('No tienes permisos para realizar esta acción.');
  });

  it('maps validation warehouse error to backend message', () => {
    createWarehouseUseCase.execute.mockReturnValueOnce(
      throwError(() => new WarehouseValidationError('name', 'Name already exists.'))
    );

    store.saveWarehouse({
      name: 'Almacen Central',
      address: ADDRESS_A,
    });

    expect(store.dialogError()).toBe('Name already exists.');
    expect(store.error()).toBeNull();
  });

  it('creates a new warehouse and updates state', () => {
    const payload: CreateWarehousePayload = {
      name: 'Almacen Sur',
      address: {
        street: 'Avenida de la Industria 789',
        city: 'Valencia',
        province: 'Valencia',
        postalCode: '46001',
      },
    };

    createWarehouseUseCase.execute.mockReturnValueOnce(of(WAREHOUSE_B));

    store.openCreateDialog();
    store.saveWarehouse(payload);

    expect(createWarehouseUseCase.execute).toHaveBeenCalledWith(payload);
    expect(store.warehouses()).toEqual([WAREHOUSE_B]);
    expect(store.dialogVisible()).toBe(false);
    expect(store.selectedWarehouse()).toBeNull();
  });

  it('updates an existing warehouse in edit mode', () => {
    const updated: Warehouse = { ...WAREHOUSE_A, name: 'Almacen Principal' };
    const payload: UpdateWarehousePayload = {
      name: 'Almacen Principal',
      address: WAREHOUSE_A.addressData,
    };
    const expectedPayload: UpdateWarehousePayload = {
      name: 'Almacen Principal',
      address: WAREHOUSE_A.addressData,
    };

    getWarehousesUseCase.execute.mockReturnValueOnce(of([WAREHOUSE_A]));
    store.loadWarehouses();

    updateWarehouseUseCase.execute.mockReturnValueOnce(of(updated));

    store.openEditDialog(WAREHOUSE_A);
    store.saveWarehouse(payload);

    expect(updateWarehouseUseCase.execute).toHaveBeenCalledWith(WAREHOUSE_A.warehouseId, expectedPayload);
    expect(store.warehouses()).toEqual([updated]);
    expect(store.dialogVisible()).toBe(false);
  });

  it('deletes warehouse and closes confirm dialog', () => {
    getWarehousesUseCase.execute.mockReturnValueOnce(of([WAREHOUSE_A]));
    store.loadWarehouses();

    deleteWarehouseUseCase.execute.mockReturnValueOnce(of(undefined));

    store.requestDeleteWarehouse(WAREHOUSE_A);
    store.confirmDeleteWarehouse();

    expect(deleteWarehouseUseCase.execute).toHaveBeenCalledWith(WAREHOUSE_A.warehouseId);
    expect(store.warehouses()).toEqual([]);
    expect(store.confirmDialogVisible()).toBe(false);
    expect(store.warehouseToDelete()).toBeNull();
  });

  it('sets search query and triggers search via computed signal', () => {
    const query = 'Norte';
    
    getWarehousesUseCase.execute.mockReturnValueOnce(of([WAREHOUSE_A, WAREHOUSE_B]));
    store.loadWarehouses();
    store.onSearch(query);

    expect(store.searchQuery()).toBe(query);
    expect(store.filteredWarehouses()).toEqual([WAREHOUSE_B]);
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

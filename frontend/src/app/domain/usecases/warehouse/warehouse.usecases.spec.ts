import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { WarehouseRepository } from '@domain/repositories/warehouse.repository';
import {
  Warehouse,
  CreateWarehousePayload,
  UpdateWarehousePayload,
  WarehouseListResult,
} from '@domain/models/warehouse.model';
import { WarehouseValidationError } from '@domain/models/warehouse-errors';
import { GetWarehousesUseCase } from '@domain/usecases/warehouse/get-warehouses.usecase';
import { GetWarehouseByIdUseCase } from '@domain/usecases/warehouse/get-warehouse-by-id.usecase';
import { CreateWarehouseUseCase } from '@domain/usecases/warehouse/create-warehouse.usecase';
import { UpdateWarehouseUseCase } from '@domain/usecases/warehouse/update-warehouse.usecase';
import { DeleteWarehouseUseCase } from '@domain/usecases/warehouse/delete-warehouse.usecase';
import { Observable, firstValueFrom, of } from 'rxjs';

const ADDRESS = {
  street: 'Calle Principal 123',
  city: 'Madrid',
  province: 'Madrid',
  postalCode: '28001',
};

const WAREHOUSE_MOCK: Warehouse = {
  warehouseId: 1,
  name: 'Almacen Central',
  address: 'Calle Principal 123, Madrid, Madrid, 28001',
  addressData: ADDRESS,
  totalStock: 100,
};

class MockWarehouseRepository implements WarehouseRepository {
  getWarehouses = vi.fn<() => Observable<WarehouseListResult>>();
  getWarehouseById = vi.fn<(warehouseId: number) => Observable<Warehouse>>();
  createWarehouse = vi.fn<(payload: CreateWarehousePayload) => Observable<Warehouse>>();
  updateWarehouse = vi.fn<(warehouseId: number, payload: UpdateWarehousePayload) => Observable<Warehouse>>();
  deleteWarehouse = vi.fn<(warehouseId: number) => Observable<void>>();
}

describe('Warehouse Use Cases', () => {
  let repo: MockWarehouseRepository;

  beforeEach(() => {
    repo = new MockWarehouseRepository();
    TestBed.configureTestingModule({
      providers: [
        GetWarehousesUseCase,
        GetWarehouseByIdUseCase,
        CreateWarehouseUseCase,
        UpdateWarehouseUseCase,
        DeleteWarehouseUseCase,
        { provide: WarehouseRepository, useValue: repo },
      ],
    });
  });

  it('GetWarehousesUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetWarehousesUseCase);
    const warehouses: WarehouseListResult = [WAREHOUSE_MOCK];
    repo.getWarehouses.mockReturnValueOnce(of(warehouses));

    const result = await firstValueFrom(useCase.execute());

    expect(repo.getWarehouses).toHaveBeenCalledOnce();
    expect(result).toEqual(warehouses);
  });

  it('GetWarehouseByIdUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetWarehouseByIdUseCase);
    repo.getWarehouseById.mockReturnValueOnce(of(WAREHOUSE_MOCK));

    const result = await firstValueFrom(useCase.execute(1));

    expect(repo.getWarehouseById).toHaveBeenCalledWith(1);
    expect(result).toEqual(WAREHOUSE_MOCK);
  });

  it('GetWarehouseByIdUseCase rejects invalid ids', async () => {
    const useCase = TestBed.inject(GetWarehouseByIdUseCase);

    await expect(firstValueFrom(useCase.execute(0))).rejects.toBeInstanceOf(
      WarehouseValidationError,
    );
    await expect(firstValueFrom(useCase.execute(1.5))).rejects.toMatchObject({
      field: 'warehouseId',
      message: 'Warehouse ID must be a positive integer.',
    });
    expect(repo.getWarehouseById).not.toHaveBeenCalled();
  });

  describe('CreateWarehouseUseCase', () => {
    it('delegates with trimmed values on valid payload', async () => {
      const useCase = TestBed.inject(CreateWarehouseUseCase);
      const payload: CreateWarehousePayload = {
        name: '  Almacen Central  ',
        address: {
          street: '  Calle Principal 123  ',
          city: '  Madrid  ',
          province: '  Madrid  ',
          postalCode: '  28001  ',
        },
      };
      repo.createWarehouse.mockReturnValueOnce(of(WAREHOUSE_MOCK));

      const result = await firstValueFrom(useCase.execute(payload));

      expect(repo.createWarehouse).toHaveBeenCalledWith({
        name: 'Almacen Central',
        address: ADDRESS,
      });
      expect(result).toEqual(WAREHOUSE_MOCK);
    });

    it('rejects invalid name or address fields', async () => {
      const useCase = TestBed.inject(CreateWarehouseUseCase);

      await expect(
        firstValueFrom(useCase.execute({ name: ' ', address: ADDRESS })),
      ).rejects.toMatchObject({ field: 'name', message: 'Name is required.' });

      await expect(
        firstValueFrom(useCase.execute({
          name: 'Almacen Central',
          address: { ...ADDRESS, street: 'Cll' },
        })),
      ).rejects.toMatchObject({
        field: 'address.street',
        message: 'Street must be between 5 and 255 characters.',
      });

      await expect(
        firstValueFrom(useCase.execute({
          name: 'Almacen Central',
          address: { ...ADDRESS, city: ' ' },
        })),
      ).rejects.toMatchObject({ field: 'address.city', message: 'City is required.' });

      expect(repo.createWarehouse).not.toHaveBeenCalled();
    });
  });

  describe('UpdateWarehouseUseCase', () => {
    it('delegates with trimmed values on valid payload', async () => {
      const useCase = TestBed.inject(UpdateWarehouseUseCase);
      const payload: UpdateWarehousePayload = {
        name: '  Almacen Principal  ',
        address: {
          street: '  Calle Nueva 456  ',
          city: '  Madrid  ',
          province: '  Madrid  ',
          postalCode: '  28002  ',
        },
      };
      const updated: Warehouse = {
        ...WAREHOUSE_MOCK,
        name: 'Almacen Principal',
        address: 'Calle Nueva 456, Madrid, Madrid, 28002',
        addressData: {
          street: 'Calle Nueva 456',
          city: 'Madrid',
          province: 'Madrid',
          postalCode: '28002',
        },
      };
      repo.updateWarehouse.mockReturnValueOnce(of(updated));

      const result = await firstValueFrom(useCase.execute(1, payload));

      expect(repo.updateWarehouse).toHaveBeenCalledWith(1, {
        name: 'Almacen Principal',
        address: updated.addressData,
      });
      expect(result).toEqual(updated);
    });

    it('rejects invalid ids and invalid address fields', async () => {
      const useCase = TestBed.inject(UpdateWarehouseUseCase);

      await expect(
        firstValueFrom(useCase.execute(0, { name: 'Almacen Central', address: ADDRESS })),
      ).rejects.toMatchObject({
        field: 'warehouseId',
        message: 'Warehouse ID must be a positive integer.',
      });

      await expect(
        firstValueFrom(useCase.execute(1, {
          name: 'Almacen Central',
          address: { ...ADDRESS, postalCode: '' },
        })),
      ).rejects.toMatchObject({
        field: 'address.postalCode',
        message: 'Postal code is required.',
      });

      expect(repo.updateWarehouse).not.toHaveBeenCalled();
    });
  });

  it('DeleteWarehouseUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(DeleteWarehouseUseCase);
    repo.deleteWarehouse.mockReturnValueOnce(of(undefined));

    await firstValueFrom(useCase.execute(1));

    expect(repo.deleteWarehouse).toHaveBeenCalledWith(1);
    expect(repo.deleteWarehouse).toHaveBeenCalledOnce();
  });
});

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

const WAREHOUSE_MOCK: Warehouse = {
  warehouseId: 1,
  name: 'Almacén Central',
  address: 'Calle Principal 123',
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

  it('GetWarehousesUseCase should delegate to repository', async () => {
    const useCase = TestBed.inject(GetWarehousesUseCase);
    const warehouses: WarehouseListResult = [WAREHOUSE_MOCK];
    repo.getWarehouses.mockReturnValueOnce(of(warehouses));

    const result = await firstValueFrom(useCase.execute());

    expect(repo.getWarehouses).toHaveBeenCalledOnce();
    expect(result).toEqual(warehouses);
  });

  it('GetWarehouseByIdUseCase should delegate to repository', async () => {
    const useCase = TestBed.inject(GetWarehouseByIdUseCase);
    repo.getWarehouseById.mockReturnValueOnce(of(WAREHOUSE_MOCK));

    const result = await firstValueFrom(useCase.execute(1));

    expect(repo.getWarehouseById).toHaveBeenCalledWith(1);
    expect(result).toEqual(WAREHOUSE_MOCK);
  });

  // ─── CreateWarehouseUseCase ────────────────────────────────────────────────

  describe('CreateWarehouseUseCase', () => {
    it('should delegate to repository with trimmed values on valid payload', async () => {
      const useCase = TestBed.inject(CreateWarehouseUseCase);
      const payload: CreateWarehousePayload = {
        name: '  Almacén Central  ',
        address: '  Calle Principal 123  ',
      };
      repo.createWarehouse.mockReturnValueOnce(of(WAREHOUSE_MOCK));

      const result = await firstValueFrom(useCase.execute(payload));

      expect(repo.createWarehouse).toHaveBeenCalledWith({
        name: 'Almacén Central',
        address: 'Calle Principal 123',
      });
      expect(result).toEqual(WAREHOUSE_MOCK);
    });

    it('should throw WarehouseValidationError when name is empty', async () => {
      const useCase = TestBed.inject(CreateWarehouseUseCase);

      await expect(
        firstValueFrom(useCase.execute({ name: '   ', address: 'Calle Principal 123' })),
      ).rejects.toBeInstanceOf(WarehouseValidationError);

      await expect(
        firstValueFrom(useCase.execute({ name: '   ', address: 'Calle Principal 123' })),
      ).rejects.toMatchObject({ field: 'name' });

      expect(repo.createWarehouse).not.toHaveBeenCalled();
    });

    it('should throw WarehouseValidationError when name is too short', async () => {
      const useCase = TestBed.inject(CreateWarehouseUseCase);

      await expect(
        firstValueFrom(useCase.execute({ name: 'A', address: 'Calle Principal 123' })),
      ).rejects.toBeInstanceOf(WarehouseValidationError);

      await expect(
        firstValueFrom(useCase.execute({ name: 'A', address: 'Calle Principal 123' })),
      ).rejects.toMatchObject({ field: 'name' });

      expect(repo.createWarehouse).not.toHaveBeenCalled();
    });

    it('should throw WarehouseValidationError when name is too long', async () => {
      const useCase = TestBed.inject(CreateWarehouseUseCase);
      const longName = 'A'.repeat(101);

      await expect(
        firstValueFrom(useCase.execute({ name: longName, address: 'Calle Principal 123' })),
      ).rejects.toBeInstanceOf(WarehouseValidationError);

      await expect(
        firstValueFrom(useCase.execute({ name: longName, address: 'Calle Principal 123' })),
      ).rejects.toMatchObject({ field: 'name' });

      expect(repo.createWarehouse).not.toHaveBeenCalled();
    });

    it('should throw WarehouseValidationError when address is empty', async () => {
      const useCase = TestBed.inject(CreateWarehouseUseCase);

      await expect(
        firstValueFrom(useCase.execute({ name: 'Almacén Central', address: '   ' })),
      ).rejects.toBeInstanceOf(WarehouseValidationError);

      await expect(
        firstValueFrom(useCase.execute({ name: 'Almacén Central', address: '   ' })),
      ).rejects.toMatchObject({ field: 'address' });

      expect(repo.createWarehouse).not.toHaveBeenCalled();
    });

    it('should throw WarehouseValidationError when address is too short', async () => {
      const useCase = TestBed.inject(CreateWarehouseUseCase);

      await expect(
        firstValueFrom(useCase.execute({ name: 'Almacén Central', address: 'Cll' })),
      ).rejects.toBeInstanceOf(WarehouseValidationError);

      await expect(
        firstValueFrom(useCase.execute({ name: 'Almacén Central', address: 'Cll' })),
      ).rejects.toMatchObject({ field: 'address' });

      expect(repo.createWarehouse).not.toHaveBeenCalled();
    });

    it('should throw WarehouseValidationError when address is too long', async () => {
      const useCase = TestBed.inject(CreateWarehouseUseCase);
      const longAddress = 'A'.repeat(256);

      await expect(
        firstValueFrom(useCase.execute({ name: 'Almacén Central', address: longAddress })),
      ).rejects.toBeInstanceOf(WarehouseValidationError);

      await expect(
        firstValueFrom(useCase.execute({ name: 'Almacén Central', address: longAddress })),
      ).rejects.toMatchObject({ field: 'address' });

      expect(repo.createWarehouse).not.toHaveBeenCalled();
    });
  });

  // ─── UpdateWarehouseUseCase ────────────────────────────────────────────────

  describe('UpdateWarehouseUseCase', () => {
    it('should delegate to repository with trimmed values on valid payload', async () => {
      const useCase = TestBed.inject(UpdateWarehouseUseCase);
      const payload: UpdateWarehousePayload = {
        name: '  Almacén Principal  ',
        address: '  Calle Nueva 456  ',
      };
      const updated: Warehouse = { ...WAREHOUSE_MOCK, name: 'Almacén Principal', address: 'Calle Nueva 456' };
      repo.updateWarehouse.mockReturnValueOnce(of(updated));

      const result = await firstValueFrom(useCase.execute(1, payload));

      expect(repo.updateWarehouse).toHaveBeenCalledWith(1, {
        name: 'Almacén Principal',
        address: 'Calle Nueva 456',
      });
      expect(result).toEqual(updated);
    });

    it('should throw WarehouseValidationError when warehouseId is zero', async () => {
      const useCase = TestBed.inject(UpdateWarehouseUseCase);

      await expect(
        firstValueFrom(useCase.execute(0, { name: 'Almacén Central', address: 'Calle Principal 123' })),
      ).rejects.toBeInstanceOf(WarehouseValidationError);

      await expect(
        firstValueFrom(useCase.execute(0, { name: 'Almacén Central', address: 'Calle Principal 123' })),
      ).rejects.toMatchObject({ field: 'warehouseId' });

      expect(repo.updateWarehouse).not.toHaveBeenCalled();
    });

    it('should throw WarehouseValidationError when warehouseId is negative', async () => {
      const useCase = TestBed.inject(UpdateWarehouseUseCase);

      await expect(
        firstValueFrom(useCase.execute(-5, { name: 'Almacén Central', address: 'Calle Principal 123' })),
      ).rejects.toBeInstanceOf(WarehouseValidationError);

      await expect(
        firstValueFrom(useCase.execute(-5, { name: 'Almacén Central', address: 'Calle Principal 123' })),
      ).rejects.toMatchObject({ field: 'warehouseId' });

      expect(repo.updateWarehouse).not.toHaveBeenCalled();
    });

    it('should throw WarehouseValidationError when warehouseId is not an integer', async () => {
      const useCase = TestBed.inject(UpdateWarehouseUseCase);

      await expect(
        firstValueFrom(useCase.execute(1.5, { name: 'Almacén Central', address: 'Calle Principal 123' })),
      ).rejects.toBeInstanceOf(WarehouseValidationError);

      await expect(
        firstValueFrom(useCase.execute(1.5, { name: 'Almacén Central', address: 'Calle Principal 123' })),
      ).rejects.toMatchObject({ field: 'warehouseId' });

      expect(repo.updateWarehouse).not.toHaveBeenCalled();
    });

    it('should throw WarehouseValidationError when name is empty', async () => {
      const useCase = TestBed.inject(UpdateWarehouseUseCase);

      await expect(
        firstValueFrom(useCase.execute(1, { name: '', address: 'Calle Principal 123' })),
      ).rejects.toBeInstanceOf(WarehouseValidationError);

      await expect(
        firstValueFrom(useCase.execute(1, { name: '', address: 'Calle Principal 123' })),
      ).rejects.toMatchObject({ field: 'name' });

      expect(repo.updateWarehouse).not.toHaveBeenCalled();
    });

    it('should throw WarehouseValidationError when address is empty', async () => {
      const useCase = TestBed.inject(UpdateWarehouseUseCase);

      await expect(
        firstValueFrom(useCase.execute(1, { name: 'Almacén Central', address: '' })),
      ).rejects.toBeInstanceOf(WarehouseValidationError);

      await expect(
        firstValueFrom(useCase.execute(1, { name: 'Almacén Central', address: '' })),
      ).rejects.toMatchObject({ field: 'address' });

      expect(repo.updateWarehouse).not.toHaveBeenCalled();
    });
  });

  // ─── DeleteWarehouseUseCase ────────────────────────────────────────────────

  it('DeleteWarehouseUseCase should delegate to repository', async () => {
    const useCase = TestBed.inject(DeleteWarehouseUseCase);
    repo.deleteWarehouse.mockReturnValueOnce(of(undefined));

    await firstValueFrom(useCase.execute(1));

    expect(repo.deleteWarehouse).toHaveBeenCalledWith(1);
    expect(repo.deleteWarehouse).toHaveBeenCalledOnce();
  });

});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { WarehouseRepository } from '@domain/repositories/warehouse.repository';
import {
  Warehouse,
  CreateWarehousePayload,
  UpdateWarehousePayload,
  WarehouseListResult,
} from '@domain/models/warehouse.model';
import { GetWarehousesUseCase } from '@domain/usecases/warehouse/get-warehouses.usecase';
import { GetWarehouseByIdUseCase } from '@domain/usecases/warehouse/get-warehouse-by-id.usecase';
import { CreateWarehouseUseCase } from '@domain/usecases/warehouse/create-warehouse.usecase';
import { UpdateWarehouseUseCase } from '@domain/usecases/warehouse/update-warehouse.usecase';
import { DeleteWarehouseUseCase } from '@domain/usecases/warehouse/delete-warehouse.usecase';
import { GetWarehouseByNameUseCase } from '@domain/usecases/warehouse/get-warehouse-by-name.usecase';
import { GetWarehouseTotalStockUseCase } from '@domain/usecases/warehouse/get-warehouse-total-stock.usecase';

const WAREHOUSE_MOCK: Warehouse = {
  warehouseId: 1,
  name: 'Almacén Central',
  address: 'Calle Principal 123',
  totalStock: 100,
};

class MockWarehouseRepository implements WarehouseRepository {
  getWarehouses = vi.fn<() => Promise<WarehouseListResult>>();
  getWarehouseById = vi.fn<(warehouseId: number) => Promise<Warehouse>>();
  getWarehouseByName = vi.fn<(name: string) => Promise<Warehouse | null>>();
  createWarehouse = vi.fn<(payload: CreateWarehousePayload) => Promise<Warehouse>>();
  updateWarehouse = vi.fn<(warehouseId: number, payload: UpdateWarehousePayload) => Promise<Warehouse>>();
  deleteWarehouse = vi.fn<(warehouseId: number) => Promise<void>>();
  getWarehouseTotalStock = vi.fn<(warehouseId: number) => Promise<number>>();
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
        GetWarehouseByNameUseCase,
        GetWarehouseTotalStockUseCase,
        { provide: WarehouseRepository, useValue: repo },
      ],
    });
  });

  it('GetWarehousesUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetWarehousesUseCase);
    const resultMock: WarehouseListResult = [WAREHOUSE_MOCK];
    repo.getWarehouses.mockResolvedValueOnce(resultMock);

    const result = await useCase.execute();

    expect(repo.getWarehouses).toHaveBeenCalledOnce();
    expect(result).toEqual(resultMock);
  });

  it('GetWarehouseByIdUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetWarehouseByIdUseCase);
    repo.getWarehouseById.mockResolvedValueOnce(WAREHOUSE_MOCK);

    const result = await useCase.execute(1);

    expect(repo.getWarehouseById).toHaveBeenCalledWith(1);
    expect(result).toEqual(WAREHOUSE_MOCK);
  });


  it('CreateWarehouseUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(CreateWarehouseUseCase);
    const payload: CreateWarehousePayload = {
      name: 'Almacén Central',
      address: 'Calle Principal 123',
    };
    repo.createWarehouse.mockResolvedValueOnce(WAREHOUSE_MOCK);

    const result = await useCase.execute(payload);

    expect(repo.createWarehouse).toHaveBeenCalledWith(payload);
    expect(result).toEqual(WAREHOUSE_MOCK);
  });

  it('UpdateWarehouseUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(UpdateWarehouseUseCase);
    const payload: UpdateWarehousePayload = { 
      name: 'Almacén Principal',
      address: 'Calle Nueva 456'
    };
    const updated: Warehouse = { ...WAREHOUSE_MOCK, name: 'Almacén Principal', address: 'Calle Nueva 456' };
    repo.updateWarehouse.mockResolvedValueOnce(updated);

    const result = await useCase.execute(1, payload);

    expect(repo.updateWarehouse).toHaveBeenCalledWith(1, payload);
    expect(result).toEqual(updated);
  });

  it('DeleteWarehouseUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(DeleteWarehouseUseCase);
    repo.deleteWarehouse.mockResolvedValueOnce();

    await useCase.execute(1);

    expect(repo.deleteWarehouse).toHaveBeenCalledWith(1);
    expect(repo.deleteWarehouse).toHaveBeenCalledOnce();
  });

  it('GetWarehouseByNameUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetWarehouseByNameUseCase);
    repo.getWarehouseByName.mockResolvedValueOnce(WAREHOUSE_MOCK);

    const result = await useCase.execute('Almacén Central');

    expect(repo.getWarehouseByName).toHaveBeenCalledWith('Almacén Central');
    expect(result).toEqual(WAREHOUSE_MOCK);
  });

  it('GetWarehouseTotalStockUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetWarehouseTotalStockUseCase);
    repo.getWarehouseTotalStock.mockResolvedValueOnce(100);

    const result = await useCase.execute(1);

    expect(repo.getWarehouseTotalStock).toHaveBeenCalledWith(1);
    expect(result).toBe(100);
  });

});

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
import { Observable, of } from 'rxjs';

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

  it('GetWarehousesUseCase delegates to repository', () => {
    const useCase = TestBed.inject(GetWarehousesUseCase);
    const resultMock: WarehouseListResult = [WAREHOUSE_MOCK];
    repo.getWarehouses.mockReturnValueOnce(of(resultMock));

    useCase.execute().subscribe((result) => {
      expect(repo.getWarehouses).toHaveBeenCalledOnce();
      expect(result).toEqual(resultMock);
    });
  });

  it('GetWarehouseByIdUseCase delegates to repository', () => {
    const useCase = TestBed.inject(GetWarehouseByIdUseCase);
    repo.getWarehouseById.mockReturnValueOnce(of(WAREHOUSE_MOCK));

    useCase.execute(1).subscribe((result) => {
      expect(repo.getWarehouseById).toHaveBeenCalledWith(1);
      expect(result).toEqual(WAREHOUSE_MOCK);
    });
  });

  it('CreateWarehouseUseCase delegates to repository', () => {
    const useCase = TestBed.inject(CreateWarehouseUseCase);
    const payload: CreateWarehousePayload = {
      name: 'Almacén Central',
      address: 'Calle Principal 123',
    };
    repo.createWarehouse.mockReturnValueOnce(of(WAREHOUSE_MOCK));

    useCase.execute(payload).subscribe((result) => {
      expect(repo.createWarehouse).toHaveBeenCalledWith(payload);
      expect(result).toEqual(WAREHOUSE_MOCK);
    });
  });

  it('UpdateWarehouseUseCase delegates to repository', () => {
    const useCase = TestBed.inject(UpdateWarehouseUseCase);
    const payload: UpdateWarehousePayload = { 
      name: 'Almacén Principal',
      address: 'Calle Nueva 456'
    };
    const updated: Warehouse = { ...WAREHOUSE_MOCK, name: 'Almacén Principal', address: 'Calle Nueva 456' };
    repo.updateWarehouse.mockReturnValueOnce(of(updated));

    useCase.execute(1, payload).subscribe((result) => {
      expect(repo.updateWarehouse).toHaveBeenCalledWith(1, payload);
      expect(result).toEqual(updated);
    });
  });

  it('DeleteWarehouseUseCase delegates to repository', () => {
    const useCase = TestBed.inject(DeleteWarehouseUseCase);
    repo.deleteWarehouse.mockReturnValueOnce(of(undefined));

    useCase.execute(1).subscribe(() => {
      expect(repo.deleteWarehouse).toHaveBeenCalledWith(1);
      expect(repo.deleteWarehouse).toHaveBeenCalledOnce();
    });
  });

});

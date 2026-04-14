import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import {
  StockDistributionFilters,
  StockDistributionItem,
  StockDistributionListResult,
} from '@domain/models/stock-distribution.model';
import { StockDistributionValidationError } from '@domain/models/stock-distribution-errors';
import { Warehouse } from '@domain/models/warehouse.model';
import { WarehouseValidationError } from '@domain/models/warehouse-errors';
import { GetStockDistributionUseCase } from '@domain/usecases/stock-distribution/get-stock-distribution.usecase';
import { GetWarehouseByIdUseCase } from '@domain/usecases/warehouse/get-warehouse-by-id.usecase';
import { WarehouseDetailStore } from './warehouse-detail.store';

const WAREHOUSE: Warehouse = {
  warehouseId: 1,
  name: 'Almacen Central',
  address: 'Calle Principal 123',
  addressData: {
    street: 'Calle Principal 123',
    city: 'Madrid',
    province: 'Madrid',
    postalCode: '28001',
  },
  totalStock: 50,
};

const STOCK_ITEM: StockDistributionItem = {
  warehouseId: 1,
  warehouseName: 'Almacen Central',
  productId: 10,
  productCode: 'SKU-10',
  productName: 'Producto A',
  stock: 50,
  reservedStock: 10,
  availableStock: 40,
};

const ZERO_AVAILABLE_STOCK_ITEM: StockDistributionItem = {
  ...STOCK_ITEM,
  productId: 11,
  productCode: 'SKU-11',
  productName: 'Producto B',
  stock: 5,
  reservedStock: 5,
  availableStock: 0,
};

class MockGetWarehouseByIdUseCase {
  execute = vi.fn<(warehouseId: number) => Observable<Warehouse>>();
}

class MockGetStockDistributionUseCase {
  execute = vi.fn<(filters?: StockDistributionFilters) => Observable<StockDistributionListResult>>();
}

describe('WarehouseDetailStore', () => {
  let store: WarehouseDetailStore;
  let getWarehouseByIdUseCase: MockGetWarehouseByIdUseCase;
  let getStockDistributionUseCase: MockGetStockDistributionUseCase;

  beforeEach(() => {
    getWarehouseByIdUseCase = new MockGetWarehouseByIdUseCase();
    getStockDistributionUseCase = new MockGetStockDistributionUseCase();

    getWarehouseByIdUseCase.execute.mockReturnValue(of(WAREHOUSE));
    getStockDistributionUseCase.execute.mockReturnValue(of({
      data: [STOCK_ITEM],
      total: 1,
      page: 1,
      pageSize: 20,
    }));

    TestBed.configureTestingModule({
      providers: [
        WarehouseDetailStore,
        { provide: GetWarehouseByIdUseCase, useValue: getWarehouseByIdUseCase },
        { provide: GetStockDistributionUseCase, useValue: getStockDistributionUseCase },
      ],
    });

    store = TestBed.inject(WarehouseDetailStore);
  });

  it('loads warehouse and stock on init with default pagination', () => {
    store.init(1);

    expect(getWarehouseByIdUseCase.execute).toHaveBeenCalledWith(1);
    expect(getStockDistributionUseCase.execute).toHaveBeenCalledWith({
      warehouseId: 1,
      page: 1,
      pageSize: 20,
      productName: undefined,
    });
    expect(store.warehouse()).toEqual(WAREHOUSE);
    expect(store.stockItems()).toEqual([STOCK_ITEM]);
  });

  it('filters visible stock items by available stock', () => {
    getStockDistributionUseCase.execute.mockReturnValueOnce(of({
      data: [STOCK_ITEM, ZERO_AVAILABLE_STOCK_ITEM],
      total: 2,
      page: 1,
      pageSize: 20,
    }));

    store.init(1);

    expect(store.availableStockItems()).toEqual([STOCK_ITEM]);
  });

  it('searches stock by product name and resets page', () => {
    store.init(1);
    store.page.set(3);

    store.onStockSearch(' Producto A ');

    expect(store.page()).toBe(1);
    expect(store.productNameFilter()).toBe('Producto A');
    expect(getStockDistributionUseCase.execute).toHaveBeenLastCalledWith({
      warehouseId: 1,
      page: 1,
      pageSize: 20,
      productName: 'Producto A',
    });
  });

  it('updates pagination from table event and reloads stock', () => {
    store.init(1);
    getStockDistributionUseCase.execute.mockReturnValueOnce(of({
      data: [STOCK_ITEM],
      total: 100,
      page: 3,
      pageSize: 20,
    }));

    store.onStockPageChange({ first: 40, rows: 20 });

    expect(store.page()).toBe(3);
    expect(getStockDistributionUseCase.execute).toHaveBeenLastCalledWith({
      warehouseId: 1,
      page: 3,
      pageSize: 20,
      productName: undefined,
    });
  });

  it('maps warehouse and stock validation errors to Spanish messages', () => {
    getWarehouseByIdUseCase.execute.mockReturnValueOnce(
      throwError(() => new WarehouseValidationError('warehouseId', 'Warehouse ID must be a positive integer.')),
    );
    getStockDistributionUseCase.execute.mockReturnValueOnce(
      throwError(() => new StockDistributionValidationError(
        { field: 'pageSize' },
        'Page size must be an integer between 1 and 100.',
      )),
    );

    store.warehouseId.set(1);
    store.loadWarehouse();

    expect(store.error()).toBe('El identificador del almacen debe ser un entero positivo.');

    store.pageSize.set(0);
    store.loadStock();

    expect(store.stockError()).toBe('El tamano de pagina debe ser un entero entre 1 y 100.');
  });
});

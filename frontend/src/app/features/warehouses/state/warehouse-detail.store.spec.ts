import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { Product, PagedResult } from '@domain/models/product.model';
import {
  AdjustStockPayload,
  AdjustStockResult,
  StockDistributionFilters,
  StockDistributionItem,
  StockDistributionListResult,
} from '@domain/models/stock-distribution.model';
import {
  InvalidQuantityError,
  StockDistributionValidationError,
} from '@domain/models/stock-distribution-errors';
import { Warehouse } from '@domain/models/warehouse.model';
import { WarehouseValidationError } from '@domain/models/warehouse-errors';
import { GetProductsUseCase } from '@domain/usecases/product/get-products.usecase';
import { AdjustStockUseCase } from '@domain/usecases/stock-distribution/adjust-stock.usecase';
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

const PRODUCT: Product = {
  productId: 20,
  code: 'SKU-20',
  name: 'Producto C',
  description: 'Producto C',
  categoryId: 1,
  categoryName: 'General',
  price: 10,
  stock: 0,
  minStock: 0,
  isActive: true,
};

const ADJUST_RESULT: AdjustStockResult = {
  movementId: 100,
  warehouseId: 1,
  productId: 10,
  previousQuantity: 50,
  newQuantity: 80,
  difference: 30,
  globalStock: 120,
  createdAt: '2026-04-13T09:00:00Z',
};

class MockGetWarehouseByIdUseCase {
  execute = vi.fn<(warehouseId: number) => Observable<Warehouse>>();
}

class MockGetStockDistributionUseCase {
  execute = vi.fn<(filters?: StockDistributionFilters) => Observable<StockDistributionListResult>>();
}

class MockAdjustStockUseCase {
  execute = vi.fn<(payload: AdjustStockPayload) => Observable<AdjustStockResult>>();
}

class MockGetProductsUseCase {
  execute = vi.fn<(params: {
    page: number;
    pageSize: number;
    search?: string;
    active?: boolean;
  }) => Observable<PagedResult<Product>>>();
}

describe('WarehouseDetailStore', () => {
  let store: WarehouseDetailStore;
  let getWarehouseByIdUseCase: MockGetWarehouseByIdUseCase;
  let getStockDistributionUseCase: MockGetStockDistributionUseCase;
  let adjustStockUseCase: MockAdjustStockUseCase;
  let getProductsUseCase: MockGetProductsUseCase;

  beforeEach(() => {
    getWarehouseByIdUseCase = new MockGetWarehouseByIdUseCase();
    getStockDistributionUseCase = new MockGetStockDistributionUseCase();
    adjustStockUseCase = new MockAdjustStockUseCase();
    getProductsUseCase = new MockGetProductsUseCase();

    getWarehouseByIdUseCase.execute.mockReturnValue(of(WAREHOUSE));
    getStockDistributionUseCase.execute.mockReturnValue(of({
      data: [STOCK_ITEM],
      total: 1,
      page: 1,
      pageSize: 20,
    }));
    getProductsUseCase.execute.mockReturnValue(of({
      data: [PRODUCT],
      total: 1,
      page: 1,
      pageSize: 20,
    }));

    TestBed.configureTestingModule({
      providers: [
        WarehouseDetailStore,
        { provide: GetWarehouseByIdUseCase, useValue: getWarehouseByIdUseCase },
        { provide: GetStockDistributionUseCase, useValue: getStockDistributionUseCase },
        { provide: AdjustStockUseCase, useValue: adjustStockUseCase },
        { provide: GetProductsUseCase, useValue: getProductsUseCase },
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

  it('keeps every stock item returned by the backend', () => {
    getStockDistributionUseCase.execute.mockReturnValueOnce(of({
      data: [STOCK_ITEM, ZERO_AVAILABLE_STOCK_ITEM],
      total: 2,
      page: 1,
      pageSize: 20,
    }));

    store.init(1);

    expect(store.stockItems()).toEqual([STOCK_ITEM, ZERO_AVAILABLE_STOCK_ITEM]);
    expect(store.total()).toBe(2);
  });

  it('shows a handled error for an invalid warehouse id', () => {
    store.stockError.set('Error previo de stock.');

    store.showInvalidWarehouseIdError();

    expect(store.error()).toBe('El identificador del almacen debe ser un entero positivo.');
    expect(store.stockError()).toBeNull();
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

  it('opens existing stock adjustment dialog with selected item', () => {
    store.openAdjustExistingDialog(STOCK_ITEM);

    expect(store.adjustMode()).toBe('existing');
    expect(store.selectedStockItem()).toEqual(STOCK_ITEM);
    expect(store.selectedProductLabel()).toBe('SKU-10 - Producto A');
    expect(store.adjustDialogVisible()).toBe(true);
  });

  it('opens initial stock dialog and loads active products', () => {
    store.openInitialStockDialog();

    expect(store.adjustMode()).toBe('initial');
    expect(getProductsUseCase.execute).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      search: undefined,
      active: true,
    });
    expect(store.productOptions()).toEqual([
      {
        productId: 20,
        label: 'SKU-20 - Producto C',
        product: PRODUCT,
      },
    ]);
  });

  it('searches active products for initial stock', () => {
    store.searchProducts(' Producto C ');

    expect(getProductsUseCase.execute).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      search: 'Producto C',
      active: true,
    });
  });

  it('adjusts existing stock and refreshes warehouse and stock', () => {
    store.init(1);
    store.openAdjustExistingDialog(STOCK_ITEM);
    getWarehouseByIdUseCase.execute.mockReturnValueOnce(of({
      ...WAREHOUSE,
      totalStock: 0,
    }));
    getStockDistributionUseCase.execute.mockReturnValueOnce(of({
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
    }));
    adjustStockUseCase.execute.mockReturnValueOnce(of({
      ...ADJUST_RESULT,
      newQuantity: 0,
      difference: -50,
    }));

    store.confirmAdjustStock(0, 'Count');

    expect(adjustStockUseCase.execute).toHaveBeenCalledWith({
      warehouseId: 1,
      productId: 10,
      newQuantity: 0,
      reason: 'Count',
    });
    expect(getWarehouseByIdUseCase.execute).toHaveBeenCalledTimes(2);
    expect(getStockDistributionUseCase.execute).toHaveBeenCalledTimes(2);
    expect(store.stockItems()).toEqual([]);
    expect(store.total()).toBe(0);
    expect(store.warehouse()?.totalStock).toBe(0);
    expect(store.adjustDialogVisible()).toBe(false);
  });

  it('creates initial stock for selected product and refreshes warehouse and stock', () => {
    store.init(1);
    store.openInitialStockDialog();
    store.selectProduct(20);
    adjustStockUseCase.execute.mockReturnValueOnce(of({
      ...ADJUST_RESULT,
      productId: 20,
      previousQuantity: 0,
      newQuantity: 12,
      difference: 12,
    }));

    store.confirmAdjustStock(12);

    expect(adjustStockUseCase.execute).toHaveBeenCalledWith({
      warehouseId: 1,
      productId: 20,
      newQuantity: 12,
      reason: undefined,
    });
    expect(getWarehouseByIdUseCase.execute).toHaveBeenCalledTimes(2);
    expect(getStockDistributionUseCase.execute).toHaveBeenCalledTimes(2);
  });

  it('maps stock adjustment errors to dialog message', () => {
    store.init(1);
    store.openAdjustExistingDialog(STOCK_ITEM);
    adjustStockUseCase.execute.mockReturnValueOnce(
      throwError(() => new InvalidQuantityError()),
    );

    store.confirmAdjustStock(-1);

    expect(store.adjustDialogError()).toBe('La cantidad debe ser mayor o igual que 0.');
    expect(store.adjustingStock()).toBe(false);
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

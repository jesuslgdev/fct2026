import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { PagedResult } from '@domain/models/paged-result.model';
import { Product } from '@domain/models/product.model';
import { StockMovement, StockMovementDetail } from '@domain/models/stock-movement.model';
import { MovementsStore } from './movements.store';
import { ListStockMovementsUseCase } from '@domain/usecases/stock-movement/list-stock-movements.usecase';
import { GetStockMovementByIdUseCase } from '@domain/usecases/stock-movement/get-stock-movement-by-id.usecase';
import { GetProductsUseCase } from '@domain/usecases/product/get-products.usecase';
import { StockMovementForbiddenError } from '@domain/models/stock-movement-errors';

const MOVEMENT: StockMovement = {
  movementId: 1,
  productName: 'Widget',
  movementType: 'inbound',
  difference: 5,
  reason: 'Stock replenishment',
  purchaseId: null,
  saleId: null,
  createdAt: new Date('2026-01-10T12:00:00Z'),
};

const MOVEMENT_DETAIL: StockMovementDetail = {
  ...MOVEMENT,
  warehouseId: 2,
  warehouseName: 'Warehouse A',
  productId: 7,
  previousQuantity: 10,
  newQuantity: 15,
  userEmail: 'admin@example.com',
};

class MockListStockMovementsUseCase {
  execute = vi.fn<(
    payload: object,
    page: number,
    pageSize: number,
  ) => Observable<PagedResult<StockMovement>>>();
}

class MockGetStockMovementByIdUseCase {
  execute = vi.fn<(movementId: number) => Observable<StockMovementDetail>>();
}

class MockGetProductsUseCase {
  execute = vi.fn<() => Observable<PagedResult<Product>>>();
}

describe('MovementsStore', () => {
  let store: MovementsStore;
  let listUseCase: MockListStockMovementsUseCase;
  let detailUseCase: MockGetStockMovementByIdUseCase;
  let productsUseCase: MockGetProductsUseCase;

  beforeEach(() => {
    listUseCase = new MockListStockMovementsUseCase();
    detailUseCase = new MockGetStockMovementByIdUseCase();
    productsUseCase = new MockGetProductsUseCase();

    TestBed.configureTestingModule({
      providers: [
        MovementsStore,
        { provide: ListStockMovementsUseCase, useValue: listUseCase },
        { provide: GetStockMovementByIdUseCase, useValue: detailUseCase },
        { provide: GetProductsUseCase, useValue: productsUseCase },
      ],
    });

    store = TestBed.inject(MovementsStore);
  });

  it('loadMovements updates list state on success', () => {
    listUseCase.execute.mockReturnValueOnce(
      of({ data: [MOVEMENT], total: 1, page: 1, pageSize: 20 }),
    );

    store.loadMovements();

    expect(listUseCase.execute).toHaveBeenCalledWith(
      {
        productId: undefined,
        movementType: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        reasonSearch: undefined,
      },
      1,
      20,
    );
    expect(store.movements()).toEqual([MOVEMENT]);
    expect(store.total()).toBe(1);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('applyFilters resets page and reloads', () => {
    listUseCase.execute.mockReturnValue(of({ data: [], total: 0, page: 1, pageSize: 20 }));

    store.page.set(3);
    store.applyFilters();

    expect(store.page()).toBe(1);
    expect(listUseCase.execute).toHaveBeenCalled();
  });

  it('clearFilters resets filters and reloads', () => {
    listUseCase.execute.mockReturnValue(of({ data: [], total: 0, page: 1, pageSize: 20 }));

    store.selectedProductId.set(10);
    store.movementTypeFilter.set('outbound');
    store.reasonSearch.set('damaged');

    store.clearFilters();

    expect(store.selectedProductId()).toBeUndefined();
    expect(store.movementTypeFilter()).toBeUndefined();
    expect(store.reasonSearch()).toBe('');
    expect(listUseCase.execute).toHaveBeenCalled();
  });

  it('openDetailDialog loads detail and keeps dialog open on success', () => {
    detailUseCase.execute.mockReturnValueOnce(of(MOVEMENT_DETAIL));

    store.openDetailDialog(MOVEMENT);

    expect(store.detailDialogVisible()).toBe(true);
    expect(store.detailLoading()).toBe(false);
    expect(store.selectedMovementDetail()).toEqual(MOVEMENT_DETAIL);
  });

  it('openDetailDialog closes dialog and sets error on failure', () => {
    detailUseCase.execute.mockReturnValueOnce(
      throwError(() => new StockMovementForbiddenError()),
    );

    store.openDetailDialog(MOVEMENT);

    expect(store.detailDialogVisible()).toBe(false);
    expect(store.detailLoading()).toBe(false);
    expect(store.error()).toBe('No tienes permisos para realizar esta acción.');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom, of } from 'rxjs';
import { PagedResult } from '@domain/models/paged-result.model';
import {
  ListStockMovementsPayload,
  StockMovement,
  StockMovementDetail,
} from '@domain/models/stock-movement.model';
import { StockMovementRepository } from '@domain/repositories/stock-movement.repository';
import { ListStockMovementsUseCase } from './list-stock-movements.usecase';
import { GetStockMovementByIdUseCase } from './get-stock-movement-by-id.usecase';

const MOVEMENT: StockMovement = {
  movementId: 1,
  productName: 'Widget',
  movementType: 'inbound',
  difference: 5,
  reason: 'Stock replenishment',
  purchaseId: null,
  saleId: null,
  createdAt: new Date('2026-04-10T08:00:00Z'),
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

class MockStockMovementRepository implements StockMovementRepository {
  listMovements = vi.fn<(
    payload: ListStockMovementsPayload,
    page: number,
    pageSize: number,
  ) => Observable<PagedResult<StockMovement>>>();

  getMovementById = vi.fn<(movementId: number) => Observable<StockMovementDetail>>();
}

describe('Stock Movement Use Cases', () => {
  let repo: MockStockMovementRepository;

  beforeEach(() => {
    repo = new MockStockMovementRepository();
    TestBed.configureTestingModule({
      providers: [
        ListStockMovementsUseCase,
        GetStockMovementByIdUseCase,
        { provide: StockMovementRepository, useValue: repo },
      ],
    });
  });

  it('ListStockMovementsUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(ListStockMovementsUseCase);
    const payload: ListStockMovementsPayload = { movementType: 'inbound' };
    const result: PagedResult<StockMovement> = {
      data: [MOVEMENT],
      total: 1,
      page: 1,
      pageSize: 20,
    };
    repo.listMovements.mockReturnValueOnce(of(result));

    const response = await firstValueFrom(useCase.execute(payload, 1, 20));

    expect(repo.listMovements).toHaveBeenCalledWith(payload, 1, 20);
    expect(response).toEqual(result);
  });

  it('GetStockMovementByIdUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetStockMovementByIdUseCase);
    repo.getMovementById.mockReturnValueOnce(of(MOVEMENT_DETAIL));

    const response = await firstValueFrom(useCase.execute(1));

    expect(repo.getMovementById).toHaveBeenCalledWith(1);
    expect(response).toEqual(MOVEMENT_DETAIL);
  });
});

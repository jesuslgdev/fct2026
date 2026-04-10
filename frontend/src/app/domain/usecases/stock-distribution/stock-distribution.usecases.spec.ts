import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { StockDistributionRepository } from '@domain/repositories/stock-distribution.repository';
import {
  StockDistributionItem,
  AdjustStockPayload,
  AdjustStockResult,
  StockDistributionFilters,
  StockDistributionListResult,
} from '@domain/models/stock-distribution.model';
import { GetStockDistributionUseCase } from './get-stock-distribution.usecase';
import { AdjustStockUseCase } from './adjust-stock.usecase';
import {
  InvalidQuantityError,
  ReasonTooLongError,
  StockDistributionValidationError,
} from '@domain/models/stock-distribution-errors';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';

const STOCK_ITEM_MOCK: StockDistributionItem = {
  warehouseId: 1,
  warehouseName: 'Central Warehouse',
  productId: 10,
  productCode: 'SKU-123',
  productName: 'Product A',
  stock: 50,
  reservedStock: 10,
  availableStock: 40,
};

const ADJUST_STOCK_RESULT_MOCK: AdjustStockResult = {
  movementId: 100,
  warehouseId: 1,
  productId: 10,
  previousQuantity: 50,
  newQuantity: 60,
  difference: 10,
  globalStock: 200,
  createdAt: '2024-01-01T12:00:00Z',
};

class MockStockDistributionRepository implements StockDistributionRepository {
  getStockDistribution = vi.fn<(filters: StockDistributionFilters) => Observable<StockDistributionListResult>>();
  adjustStock = vi.fn<(payload: AdjustStockPayload) => Observable<AdjustStockResult>>();
}

describe('Stock Distribution Use Cases', () => {
  let repo: MockStockDistributionRepository;

  beforeEach(() => {
    repo = new MockStockDistributionRepository();
    TestBed.configureTestingModule({
      providers: [
        GetStockDistributionUseCase,
        AdjustStockUseCase,
        { provide: StockDistributionRepository, useValue: repo },
      ],
    });
  });

  describe('GetStockDistributionUseCase', () => {
    it('should apply default filters when none provided', async () => {
      const useCase = TestBed.inject(GetStockDistributionUseCase);
      const result: StockDistributionListResult = {
        data: [STOCK_ITEM_MOCK],
        total: 1,
        page: 1,
        pageSize: 20,
      };
      repo.getStockDistribution.mockReturnValue(of(result));

      const response = await firstValueFrom(useCase.execute());

      expect(repo.getStockDistribution).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
      });
      expect(response).toEqual(result);
    });

    it('should merge provided filters with defaults', async () => {
      const useCase = TestBed.inject(GetStockDistributionUseCase);
      const filters: StockDistributionFilters = { warehouseId: 1, productId: 10 };
      const result: StockDistributionListResult = {
        data: [STOCK_ITEM_MOCK],
        total: 1,
        page: 2,
        pageSize: 50,
      };
      repo.getStockDistribution.mockReturnValue(of(result));

      const response = await firstValueFrom(useCase.execute(filters));

      expect(repo.getStockDistribution).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        warehouseId: 1,
        productId: 10,
      });
      expect(response).toEqual(result);
    });

    it('should override defaults when provided', async () => {
      const useCase = TestBed.inject(GetStockDistributionUseCase);
      const filters: StockDistributionFilters = { page: 2, pageSize: 50 };
      const result: StockDistributionListResult = {
        data: [STOCK_ITEM_MOCK],
        total: 1,
        page: 2,
        pageSize: 50,
      };
      repo.getStockDistribution.mockReturnValue(of(result));

      const response = await firstValueFrom(useCase.execute(filters));

      expect(repo.getStockDistribution).toHaveBeenCalledWith({
        page: 2,
        pageSize: 50,
      });
      expect(response).toEqual(result);
    });

    it('should trim the productName filter before delegating to repository', async () => {
      const useCase = TestBed.inject(GetStockDistributionUseCase);
      const result: StockDistributionListResult = {
        data: [STOCK_ITEM_MOCK],
        total: 1,
        page: 1,
        pageSize: 20,
      };
      repo.getStockDistribution.mockReturnValue(of(result));

      const response = await firstValueFrom(
        useCase.execute({ warehouseId: 1, productName: '  product a  ' }),
      );

      expect(repo.getStockDistribution).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        warehouseId: 1,
        productName: 'product a',
      });
      expect(response).toEqual(result);
    });

    it('should throw StockDistributionValidationError when warehouseId is invalid', async () => {
      const useCase = TestBed.inject(GetStockDistributionUseCase);

      expect(() => useCase.execute({ warehouseId: 0 })).toThrowError(
        StockDistributionValidationError,
      );

      expect(repo.getStockDistribution).not.toHaveBeenCalled();
    });

    it('should throw StockDistributionValidationError when productName exceeds 255 characters', async () => {
      const useCase = TestBed.inject(GetStockDistributionUseCase);

      expect(() => useCase.execute({ productName: 'a'.repeat(256) })).toThrowError(
        StockDistributionValidationError,
      );

      expect(repo.getStockDistribution).not.toHaveBeenCalled();
    });

    it('should propagate repository errors', async () => {
      const useCase = TestBed.inject(GetStockDistributionUseCase);
      repo.getStockDistribution.mockReturnValue(throwError(() => new Error('Repository error')));

      await expect(firstValueFrom(useCase.execute())).rejects.toThrow('Repository error');
      expect(repo.getStockDistribution).toHaveBeenCalledOnce();
    });
  });

  describe('AdjustStockUseCase', () => {
    it('should trim reason field before delegating to repository', async () => {
      const useCase = TestBed.inject(AdjustStockUseCase);
      const payload: AdjustStockPayload = {
        warehouseId: 1,
        productId: 10,
        newQuantity: 60,
        reason: '  Stock adjustment  ',
      };
      const expectedPayload: AdjustStockPayload = {
        warehouseId: 1,
        productId: 10,
        newQuantity: 60,
        reason: 'Stock adjustment',
      };
      repo.adjustStock.mockReturnValue(of(ADJUST_STOCK_RESULT_MOCK));

      const result = await firstValueFrom(useCase.execute(payload));

      expect(repo.adjustStock).toHaveBeenCalledWith(expectedPayload);
      expect(result).toEqual(ADJUST_STOCK_RESULT_MOCK);
    });

    it('should handle undefined reason', async () => {
      const useCase = TestBed.inject(AdjustStockUseCase);
      const payload: AdjustStockPayload = {
        warehouseId: 1,
        productId: 10,
        newQuantity: 60,
      };
      repo.adjustStock.mockReturnValue(of(ADJUST_STOCK_RESULT_MOCK));

      const result = await firstValueFrom(useCase.execute(payload));

      expect(repo.adjustStock).toHaveBeenCalledWith({
        warehouseId: 1,
        productId: 10,
        newQuantity: 60,
        reason: undefined,
      });
      expect(result).toEqual(ADJUST_STOCK_RESULT_MOCK);
    });

    it('should treat blank reason as undefined', async () => {
      const useCase = TestBed.inject(AdjustStockUseCase);
      repo.adjustStock.mockReturnValue(of(ADJUST_STOCK_RESULT_MOCK));

      const result = await firstValueFrom(
        useCase.execute({
          warehouseId: 1,
          productId: 10,
          newQuantity: 60,
          reason: '   ',
        }),
      );

      expect(repo.adjustStock).toHaveBeenCalledWith({
        warehouseId: 1,
        productId: 10,
        newQuantity: 60,
        reason: undefined,
      });
      expect(result).toEqual(ADJUST_STOCK_RESULT_MOCK);
    });

    it('should throw InvalidQuantityError when newQuantity is negative', async () => {
      const useCase = TestBed.inject(AdjustStockUseCase);
      const payload: AdjustStockPayload = {
        warehouseId: 1,
        productId: 10,
        newQuantity: -5,
      };

      expect(() => useCase.execute(payload)).toThrowError(InvalidQuantityError);
      expect(repo.adjustStock).not.toHaveBeenCalled();
    });

    it('should throw StockDistributionValidationError when warehouseId is invalid', async () => {
      const useCase = TestBed.inject(AdjustStockUseCase);

      expect(() =>
        useCase.execute({
          warehouseId: 0,
          productId: 10,
          newQuantity: 5,
        }),
      ).toThrowError(StockDistributionValidationError);

      expect(repo.adjustStock).not.toHaveBeenCalled();
    });

    it('should throw StockDistributionValidationError when productId is invalid', async () => {
      const useCase = TestBed.inject(AdjustStockUseCase);

      expect(() =>
        useCase.execute({
          warehouseId: 1,
          productId: 0,
          newQuantity: 5,
        }),
      ).toThrowError(StockDistributionValidationError);

      expect(repo.adjustStock).not.toHaveBeenCalled();
    });

    it('should throw InvalidQuantityError when newQuantity is exactly zero (edge case)', async () => {
      const useCase = TestBed.inject(AdjustStockUseCase);
      const payload: AdjustStockPayload = {
        warehouseId: 1,
        productId: 10,
        newQuantity: 0,
      };
      repo.adjustStock.mockReturnValue(of(ADJUST_STOCK_RESULT_MOCK));

      const result = await firstValueFrom(useCase.execute(payload));

      expect(repo.adjustStock).toHaveBeenCalledWith(payload);
      expect(result).toEqual(ADJUST_STOCK_RESULT_MOCK);
    });

    it('should throw ReasonTooLongError when reason exceeds 300 characters', async () => {
      const useCase = TestBed.inject(AdjustStockUseCase);
      const payload: AdjustStockPayload = {
        warehouseId: 1,
        productId: 10,
        newQuantity: 60,
        reason: 'a'.repeat(301),
      };

      expect(() => useCase.execute(payload)).toThrowError(ReasonTooLongError);
      expect(repo.adjustStock).not.toHaveBeenCalled();
    });

    it('should accept reason exactly 300 characters', async () => {
      const useCase = TestBed.inject(AdjustStockUseCase);
      const payload: AdjustStockPayload = {
        warehouseId: 1,
        productId: 10,
        newQuantity: 60,
        reason: 'a'.repeat(300),
      };
      repo.adjustStock.mockReturnValue(of(ADJUST_STOCK_RESULT_MOCK));

      const result = await firstValueFrom(useCase.execute(payload));

      expect(repo.adjustStock).toHaveBeenCalledWith(payload);
      expect(result).toEqual(ADJUST_STOCK_RESULT_MOCK);
    });

    it('should propagate repository errors on valid payload', async () => {
      const useCase = TestBed.inject(AdjustStockUseCase);
      const payload: AdjustStockPayload = {
        warehouseId: 1,
        productId: 10,
        newQuantity: 60,
      };
      repo.adjustStock.mockReturnValue(throwError(() => new Error('Repository error')));

      await expect(firstValueFrom(useCase.execute(payload))).rejects.toThrow('Repository error');
      expect(repo.adjustStock).toHaveBeenCalledOnce();
    });

    it('should not call repository when validation fails (negative quantity)', async () => {
      const useCase = TestBed.inject(AdjustStockUseCase);
      const payload: AdjustStockPayload = {
        warehouseId: 1,
        productId: 10,
        newQuantity: -1,
      };

      expect(() => useCase.execute(payload)).toThrowError(InvalidQuantityError);
      expect(repo.adjustStock).not.toHaveBeenCalled();
    });

    it('should not call repository when validation fails (reason too long)', async () => {
      const useCase = TestBed.inject(AdjustStockUseCase);
      const payload: AdjustStockPayload = {
        warehouseId: 1,
        productId: 10,
        newQuantity: 60,
        reason: 'a'.repeat(301),
      };

      expect(() => useCase.execute(payload)).toThrowError(ReasonTooLongError);
      expect(repo.adjustStock).not.toHaveBeenCalled();
    });
  });
});

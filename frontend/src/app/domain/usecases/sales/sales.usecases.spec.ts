import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { SaleRepository } from '../../repositories/sale.repository';
import {
  CreateSale,
  PagedResult,
  Sale,
  SaleDetail,
  SaleFilters,
} from '../../models/sale.model';
import { SaleStatus } from '../../enums/sale-status.enum';
import { ListSalesUseCase } from './list-sales.usecase';
import { GetSaleUseCase } from './get-sale.usecase';
import { CreateSaleUseCase } from './create-sale.usecase';
import {
  SaleEmptyLinesError,
  SaleNotFoundError,
  SaleValidationError,
} from '../../models/sale-errors';

const SALE_DATE = new Date('2026-04-01T10:00:00.000Z');
const CREATED_AT = new Date('2026-04-01T10:01:00.000Z');
const UPDATED_AT = new Date('2026-04-01T10:02:00.000Z');
const CHANGED_AT = new Date('2026-04-01T10:03:00.000Z');

const SALE_MOCK: Sale = {
  id: 1,
  saleNumber: 'VEN-2026-0001',
  clientId: 1,
  warehouseId: 2,
  clientName: 'Test Client',
  status: SaleStatus.PENDING,
  allowedTransitions: [SaleStatus.APPROVED, SaleStatus.CANCELLED],
  deliveryAddress: 'Test Address, Test City, Test Province, 12345',
  saleDate: SALE_DATE,
  createdAt: CREATED_AT,
  total: 100,
};

const SALE_DETAIL_MOCK: SaleDetail = {
  ...SALE_MOCK,
  userId: 1,
  subtotal: 80,
  taxes: 20,
  updatedAt: UPDATED_AT,
  lines: [
    {
      id: 1,
      saleId: 1,
      productId: 1,
      quantity: 2,
      unitPrice: 40,
      lineSubtotal: 80,
      vatRate: 0.21,
      lineTax: 16.8,
    },
  ],
  statusHistory: [
    {
      fromStatus: null,
      toStatus: SaleStatus.PENDING,
      changedAt: CHANGED_AT,
      changedByUserId: 1,
    },
  ],
};

class MockSaleRepository implements SaleRepository {
  list = vi.fn<(filters: SaleFilters) => Observable<PagedResult<Sale>>>();
  getById = vi.fn<(id: number) => Observable<SaleDetail>>();
  create = vi.fn<(data: CreateSale) => Observable<SaleDetail>>();
}

describe('Sales Use Cases', () => {
  let repo: MockSaleRepository;

  beforeEach(() => {
    repo = new MockSaleRepository();
    TestBed.configureTestingModule({
      providers: [
        ListSalesUseCase,
        GetSaleUseCase,
        CreateSaleUseCase,
        { provide: SaleRepository, useValue: repo },
      ],
    });
  });

  describe('ListSalesUseCase', () => {
    it('should delegate to repository with default pagination and sorting', async () => {
      const useCase = TestBed.inject(ListSalesUseCase);
      const response: PagedResult<Sale> = {
        data: [SALE_MOCK],
        total: 1,
        page: 1,
        pageSize: 20,
      };
      repo.list.mockReturnValue(of(response));

      const result = await firstValueFrom(useCase.execute());

      expect(repo.list).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        sortField: 'created_at',
        sortOrder: 'desc',
        search: undefined,
      });
      expect(result).toEqual(response);
    });

    it('should preserve combinable filters and trim search', async () => {
      const useCase = TestBed.inject(ListSalesUseCase);
      const filters: SaleFilters = {
        page: 2,
        pageSize: 20,
        sortField: 'client_name',
        sortOrder: 'asc',
        status: SaleStatus.APPROVED,
        clientId: 7,
        dateFrom: new Date('2026-01-01T00:00:00.000Z'),
        dateTo: new Date('2026-01-31T23:59:59.000Z'),
        search: '  VEN-2026  ',
      };
      const response: PagedResult<Sale> = {
        data: [SALE_MOCK],
        total: 1,
        page: 2,
        pageSize: 20,
      };
      repo.list.mockReturnValue(of(response));

      await firstValueFrom(useCase.execute(filters));

      expect(repo.list).toHaveBeenCalledWith({
        ...filters,
        search: 'VEN-2026',
      });
    });

    it('should reject invalid page', async () => {
      const useCase = TestBed.inject(ListSalesUseCase);

      await expect(firstValueFrom(useCase.execute({ page: 0 }))).rejects.toThrow(
        SaleValidationError
      );
      expect(repo.list).not.toHaveBeenCalled();
    });

    it('should reject invalid page size', async () => {
      const useCase = TestBed.inject(ListSalesUseCase);

      await expect(firstValueFrom(useCase.execute({ pageSize: 101 }))).rejects.toThrow(
        SaleValidationError
      );
      expect(repo.list).not.toHaveBeenCalled();
    });

    it('should reject invalid client ID', async () => {
      const useCase = TestBed.inject(ListSalesUseCase);

      await expect(firstValueFrom(useCase.execute({ clientId: 0 }))).rejects.toThrow(
        SaleValidationError
      );
      expect(repo.list).not.toHaveBeenCalled();
    });

    it('should reject inverted date range', async () => {
      const useCase = TestBed.inject(ListSalesUseCase);

      await expect(
        firstValueFrom(
          useCase.execute({
            dateFrom: new Date('2026-02-01T00:00:00.000Z'),
            dateTo: new Date('2026-01-01T00:00:00.000Z'),
          })
        )
      ).rejects.toThrow(SaleValidationError);
      expect(repo.list).not.toHaveBeenCalled();
    });
  });

  describe('GetSaleUseCase', () => {
    it('should return sale detail when found', async () => {
      const useCase = TestBed.inject(GetSaleUseCase);
      repo.getById.mockReturnValue(of(SALE_DETAIL_MOCK));

      const result = await firstValueFrom(useCase.execute(1));

      expect(repo.getById).toHaveBeenCalledWith(1);
      expect(result).toEqual(SALE_DETAIL_MOCK);
    });

    it('should propagate error from repository', async () => {
      const useCase = TestBed.inject(GetSaleUseCase);
      const error = new SaleNotFoundError();
      repo.getById.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(useCase.execute(1))).rejects.toThrow(SaleNotFoundError);
    });
  });

  describe('CreateSaleUseCase', () => {
    it('should validate and delegate to repository with valid data', async () => {
      const useCase = TestBed.inject(CreateSaleUseCase);
      const data: CreateSale = {
        clientId: 1,
        warehouseId: 2,
        lines: [{ productId: 1, quantity: 5 }],
      };
      repo.create.mockReturnValue(of(SALE_DETAIL_MOCK));

      const result = await firstValueFrom(useCase.execute(data));

      expect(repo.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(SALE_DETAIL_MOCK);
    });

    it('should throw SaleValidationError if clientId is missing', async () => {
      const useCase = TestBed.inject(CreateSaleUseCase);
      const data: CreateSale = {
        clientId: 0,
        warehouseId: 2,
        lines: [{ productId: 1, quantity: 5 }],
      };

      await expect(firstValueFrom(useCase.execute(data))).rejects.toThrow(SaleValidationError);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('should throw SaleValidationError if warehouseId is missing', async () => {
      const useCase = TestBed.inject(CreateSaleUseCase);
      const data: CreateSale = {
        clientId: 1,
        warehouseId: 0,
        lines: [{ productId: 1, quantity: 5 }],
      };

      await expect(firstValueFrom(useCase.execute(data))).rejects.toThrow(SaleValidationError);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('should throw SaleEmptyLinesError if lines are empty', async () => {
      const useCase = TestBed.inject(CreateSaleUseCase);
      const data: CreateSale = { clientId: 1, warehouseId: 2, lines: [] };

      await expect(firstValueFrom(useCase.execute(data))).rejects.toThrow(SaleEmptyLinesError);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('should throw SaleValidationError if any quantity is <= 0', async () => {
      const useCase = TestBed.inject(CreateSaleUseCase);
      const data: CreateSale = {
        clientId: 1,
        warehouseId: 2,
        lines: [{ productId: 1, quantity: 0 }],
      };

      await expect(firstValueFrom(useCase.execute(data))).rejects.toThrow(SaleValidationError);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('should throw SaleValidationError if any productId is <= 0', async () => {
      const useCase = TestBed.inject(CreateSaleUseCase);
      const data: CreateSale = {
        clientId: 1,
        warehouseId: 2,
        lines: [{ productId: 0, quantity: 5 }],
      };

      await expect(firstValueFrom(useCase.execute(data))).rejects.toThrow(SaleValidationError);
      expect(repo.create).not.toHaveBeenCalled();
    });
  });
});

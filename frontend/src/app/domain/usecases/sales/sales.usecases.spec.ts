import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { SaleRepository } from '../../repositories/sale.repository';
import { Sale, SaleDetail, CreateSale, SaleFilters } from '../../models/sale.model';
import { SaleStatus } from '../../enums/sale-status.enum';
import { ListSalesUseCase } from './list-sales.usecase';
import { GetSaleUseCase } from './get-sale.usecase';
import { CreateSaleUseCase } from './create-sale.usecase';
import { SaleEmptyLinesError, SaleValidationError } from '../../models/sale-errors';

const SALE_MOCK: Sale = {
  id: 1,
  saleNumber: 'SALE-001',
  clientId: 1,
  clientName: 'Test Client',
  status: SaleStatus.PENDING,
  saleDate: new Date(),
  total: 100,
};

const SALE_DETAIL_MOCK: SaleDetail = {
  ...SALE_MOCK,
  deliveryAddress: 'Test Address',
  userId: 1,
  subtotal: 80,
  taxes: 20,
  createdAt: new Date(),
  updatedAt: new Date(),
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
};

class MockSaleRepository implements SaleRepository {
  list = vi.fn<(filters: SaleFilters) => Observable<{ data: Sale[]; total: number }>>();
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
    it('should delegate to repository', async () => {
      const useCase = TestBed.inject(ListSalesUseCase);
      const filters: SaleFilters = { page: 1, pageSize: 10 };
      const response = { data: [SALE_MOCK], total: 1 };
      repo.list.mockReturnValue(of(response));

      const result = await firstValueFrom(useCase.execute(filters));

      expect(repo.list).toHaveBeenCalledWith(filters);
      expect(result).toEqual(response);
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
      repo.getById.mockReturnValue(throwError(() => new Error('Not found')));

      await expect(firstValueFrom(useCase.execute(1))).rejects.toThrow('Not found');
    });
  });

  describe('CreateSaleUseCase', () => {
    it('should validate and delegate to repository with valid data', async () => {
      const useCase = TestBed.inject(CreateSaleUseCase);
      const data: CreateSale = {
        clientId: 1,
        lines: [{ productId: 1, quantity: 5 }],
      };
      repo.create.mockReturnValue(of(SALE_DETAIL_MOCK));

      const result = await firstValueFrom(useCase.execute(data));

      expect(repo.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(SALE_DETAIL_MOCK);
    });

    it('should throw SaleValidationError if clientId is missing', async () => {
      const useCase = TestBed.inject(CreateSaleUseCase);
      const data: CreateSale = { clientId: 0, lines: [{ productId: 1, quantity: 5 }] };

      await expect(firstValueFrom(useCase.execute(data))).rejects.toThrow('Client ID is required.');
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('should throw SaleEmptyLinesError if lines are empty', async () => {
      const useCase = TestBed.inject(CreateSaleUseCase);
      const data: CreateSale = { clientId: 1, lines: [] };

      await expect(firstValueFrom(useCase.execute(data))).rejects.toThrow(SaleEmptyLinesError);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('should throw SaleValidationError if any quantity is <= 0', async () => {
      const useCase = TestBed.inject(CreateSaleUseCase);
      const data: CreateSale = {
        clientId: 1,
        lines: [{ productId: 1, quantity: 0 }],
      };

      await expect(firstValueFrom(useCase.execute(data))).rejects.toThrow('All quantities must be greater than 0.');
      expect(repo.create).not.toHaveBeenCalled();
    });
  });
});

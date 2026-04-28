import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { SaleStatus } from '@domain/enums/sale-status.enum';
import {
  AddSaleLine,
  AdvanceSaleStatus,
  CreateSale,
  ListSalesFilters,
  PagedResult,
  Sale,
  SaleDetail,
  UpdateSale,
  UpdateSaleLine,
} from '@domain/models/sale.model';
import {
  SaleDeliveryAddressRequiredError,
  SaleEmptyLinesError,
  SaleInvalidDiscountError,
  SaleInvalidStatusTransitionError,
  SaleNotCancellableError,
  SaleNotDeletableError,
  SaleNotFoundError,
  SaleValidationError,
} from '@domain/models/sale-errors';
import { SaleRepository } from '@domain/repositories/sale.repository';
import { AddSaleLineUseCase } from './add-sale-line.usecase';
import { AdvanceSaleStatusUseCase } from './advance-sale-status.usecase';
import { CancelSaleUseCase } from './cancel-sale.usecase';
import { CreateSaleUseCase } from './create-sale.usecase';
import { DeleteSaleUseCase } from './delete-sale.usecase';
import { GetSaleUseCase } from './get-sale.usecase';
import { ListSalesUseCase } from './list-sales.usecase';
import { RemoveSaleLineUseCase } from './remove-sale-line.usecase';
import { UpdateSaleUseCase } from './update-sale.usecase';
import { UpdateSaleLineUseCase } from './update-sale-line.usecase';

const SALE_DATE = new Date('2026-04-01T10:00:00.000Z');
const CREATED_AT = new Date('2026-04-01T10:01:00.000Z');
const UPDATED_AT = new Date('2026-04-01T10:02:00.000Z');
const CHANGED_AT = new Date('2026-04-01T10:03:00.000Z');

const SALE_MOCK: Sale = {
  saleId: 1,
  saleNumber: 'VEN-2026-0001',
  clientId: 1,
  warehouseId: 2,
  clientName: 'Test Client',
  creatorName: 'Sales User',
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
      saleLineId: 1,
      saleId: 1,
      productId: 1,
      quantity: 2,
      unitPrice: 40,
      discount: 0,
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
  list = vi.fn<(filters: ListSalesFilters) => Observable<PagedResult<Sale>>>();
  getById = vi.fn<(id: number) => Observable<SaleDetail>>();
  create = vi.fn<(data: CreateSale) => Observable<SaleDetail>>();
  update = vi.fn<(saleId: number, data: UpdateSale) => Observable<SaleDetail>>();
  cancel = vi.fn<(saleId: number) => Observable<SaleDetail>>();
  delete = vi.fn<(saleId: number) => Observable<void>>();
  addLine = vi.fn<(saleId: number, data: AddSaleLine) => Observable<SaleDetail>>();
  updateLine = vi.fn<
    (saleId: number, saleLineId: number, data: UpdateSaleLine) => Observable<SaleDetail>
  >();
  removeLine = vi.fn<(saleId: number, saleLineId: number) => Observable<SaleDetail>>();
  advanceStatus = vi.fn<(saleId: number, data: AdvanceSaleStatus) => Observable<SaleDetail>>();
}

describe('Sales Use Cases', () => {
  let repo: MockSaleRepository;

  beforeEach(() => {
    repo = new MockSaleRepository();
    TestBed.configureTestingModule({
      providers: [
        AddSaleLineUseCase,
        AdvanceSaleStatusUseCase,
        CancelSaleUseCase,
        CreateSaleUseCase,
        DeleteSaleUseCase,
        GetSaleUseCase,
        ListSalesUseCase,
        RemoveSaleLineUseCase,
        UpdateSaleUseCase,
        UpdateSaleLineUseCase,
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

    it('should preserve combinable filters for the sales listing', async () => {
      const useCase = TestBed.inject(ListSalesUseCase);
      const filters: ListSalesFilters = {
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

    it('should omit empty search after trimming', async () => {
      const useCase = TestBed.inject(ListSalesUseCase);
      repo.list.mockReturnValue(
        of({
          data: [SALE_MOCK],
          total: 1,
          page: 1,
          pageSize: 20,
        })
      );

      await firstValueFrom(useCase.execute({ search: '   ' }));

      expect(repo.list).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        sortField: 'created_at',
        sortOrder: 'desc',
        search: undefined,
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

    it('should reject invalid sale ID', async () => {
      const useCase = TestBed.inject(GetSaleUseCase);

      await expect(firstValueFrom(useCase.execute(0))).rejects.toThrow(SaleValidationError);
      expect(repo.getById).not.toHaveBeenCalled();
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
        lines: [{ productId: 1, quantity: 5, discount: 10, discountType: 'percent' }],
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

    it('should reject negative discount', async () => {
      const useCase = TestBed.inject(CreateSaleUseCase);
      const data: CreateSale = {
        clientId: 1,
        warehouseId: 2,
        lines: [{ productId: 1, quantity: 5, discount: -1 }],
      };

      await expect(firstValueFrom(useCase.execute(data))).rejects.toThrow(
        SaleInvalidDiscountError
      );
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('should reject percent discount greater than or equal to 100', async () => {
      const useCase = TestBed.inject(CreateSaleUseCase);
      const data: CreateSale = {
        clientId: 1,
        warehouseId: 2,
        lines: [{ productId: 1, quantity: 5, discount: 100, discountType: 'percent' }],
      };

      await expect(firstValueFrom(useCase.execute(data))).rejects.toThrow(
        SaleInvalidDiscountError
      );
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('UpdateSaleUseCase', () => {
    it('should validate, normalize and delegate update', async () => {
      const useCase = TestBed.inject(UpdateSaleUseCase);
      const data: UpdateSale = {
        clientId: 7,
        deliveryAddress: '  Avenida de Europa 20  ',
        lines: [{ productId: 1, quantity: 2, discount: 5, discountType: 'amount' }],
      };
      repo.update.mockReturnValue(of(SALE_DETAIL_MOCK));

      const result = await firstValueFrom(useCase.execute(1, data));

      expect(repo.update).toHaveBeenCalledWith(1, {
        ...data,
        deliveryAddress: 'Avenida de Europa 20',
      });
      expect(result).toEqual(SALE_DETAIL_MOCK);
    });

    it('should reject invalid sale ID', async () => {
      const useCase = TestBed.inject(UpdateSaleUseCase);

      await expect(
        firstValueFrom(
          useCase.execute(0, {
            clientId: 1,
            deliveryAddress: 'Address',
            lines: [{ productId: 1, quantity: 1 }],
          })
        )
      ).rejects.toThrow(SaleValidationError);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('should reject blank delivery address', async () => {
      const useCase = TestBed.inject(UpdateSaleUseCase);

      await expect(
        firstValueFrom(
          useCase.execute(1, {
            clientId: 1,
            deliveryAddress: '   ',
            lines: [{ productId: 1, quantity: 1 }],
          })
        )
      ).rejects.toThrow(SaleDeliveryAddressRequiredError);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('should reject empty lines', async () => {
      const useCase = TestBed.inject(UpdateSaleUseCase);

      await expect(
        firstValueFrom(useCase.execute(1, { clientId: 1, deliveryAddress: 'Address', lines: [] }))
      ).rejects.toThrow(SaleEmptyLinesError);
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('AddSaleLineUseCase', () => {
    it('should validate and delegate add line', async () => {
      const useCase = TestBed.inject(AddSaleLineUseCase);
      const data: AddSaleLine = {
        productId: 10,
        quantity: 3,
        discount: 10,
        discountType: 'amount',
      };
      repo.addLine.mockReturnValue(of(SALE_DETAIL_MOCK));

      const result = await firstValueFrom(useCase.execute(1, data));

      expect(repo.addLine).toHaveBeenCalledWith(1, data);
      expect(result).toEqual(SALE_DETAIL_MOCK);
    });

    it('should reject invalid add line payload', async () => {
      const useCase = TestBed.inject(AddSaleLineUseCase);

      await expect(
        firstValueFrom(useCase.execute(1, { productId: 0, quantity: 1 }))
      ).rejects.toThrow(SaleValidationError);
      expect(repo.addLine).not.toHaveBeenCalled();
    });
  });

  describe('UpdateSaleLineUseCase', () => {
    it('should validate and delegate update line', async () => {
      const useCase = TestBed.inject(UpdateSaleLineUseCase);
      const data: UpdateSaleLine = {
        quantity: 4,
        discount: 10,
        discountType: 'percent',
      };
      repo.updateLine.mockReturnValue(of(SALE_DETAIL_MOCK));

      const result = await firstValueFrom(useCase.execute(1, 2, data));

      expect(repo.updateLine).toHaveBeenCalledWith(1, 2, data);
      expect(result).toEqual(SALE_DETAIL_MOCK);
    });

    it('should reject invalid sale line ID', async () => {
      const useCase = TestBed.inject(UpdateSaleLineUseCase);

      await expect(
        firstValueFrom(useCase.execute(1, 0, { quantity: 1 }))
      ).rejects.toThrow(SaleValidationError);
      expect(repo.updateLine).not.toHaveBeenCalled();
    });

    it('should reject invalid quantity', async () => {
      const useCase = TestBed.inject(UpdateSaleLineUseCase);

      await expect(
        firstValueFrom(useCase.execute(1, 1, { quantity: 0 }))
      ).rejects.toThrow(SaleValidationError);
      expect(repo.updateLine).not.toHaveBeenCalled();
    });
  });

  describe('RemoveSaleLineUseCase', () => {
    it('should validate and delegate remove line', async () => {
      const useCase = TestBed.inject(RemoveSaleLineUseCase);
      repo.removeLine.mockReturnValue(of(SALE_DETAIL_MOCK));

      const result = await firstValueFrom(useCase.execute(1, 2));

      expect(repo.removeLine).toHaveBeenCalledWith(1, 2);
      expect(result).toEqual(SALE_DETAIL_MOCK);
    });

    it('should reject invalid remove line identifiers', async () => {
      const useCase = TestBed.inject(RemoveSaleLineUseCase);

      await expect(firstValueFrom(useCase.execute(0, 0))).rejects.toThrow(SaleValidationError);
      expect(repo.removeLine).not.toHaveBeenCalled();
    });
  });

  describe('AdvanceSaleStatusUseCase', () => {
    it('should validate and delegate status transition', async () => {
      const useCase = TestBed.inject(AdvanceSaleStatusUseCase);
      const data: AdvanceSaleStatus = { newStatus: SaleStatus.APPROVED };
      repo.advanceStatus.mockReturnValue(of(SALE_DETAIL_MOCK));

      const result = await firstValueFrom(useCase.execute(1, data));

      expect(repo.advanceStatus).toHaveBeenCalledWith(1, data);
      expect(result).toEqual(SALE_DETAIL_MOCK);
    });

    it('should reject invalid target status', async () => {
      const useCase = TestBed.inject(AdvanceSaleStatusUseCase);

      await expect(
        firstValueFrom(
          useCase.execute(1, { newStatus: 'Invalid' as SaleStatus })
        )
      ).rejects.toThrow(SaleValidationError);
      expect(repo.advanceStatus).not.toHaveBeenCalled();
    });
  });

  describe('CancelSaleUseCase', () => {
    it('should cancel a sale when cancelled is an allowed transition', async () => {
      const useCase = TestBed.inject(CancelSaleUseCase);
      repo.cancel.mockReturnValue(of(SALE_DETAIL_MOCK));

      const result = await firstValueFrom(useCase.execute(SALE_DETAIL_MOCK));

      expect(repo.cancel).toHaveBeenCalledWith(1);
      expect(result).toEqual(SALE_DETAIL_MOCK);
    });

    it('should reject sales that cannot be cancelled', async () => {
      const useCase = TestBed.inject(CancelSaleUseCase);

      await expect(
        firstValueFrom(
          useCase.execute({
            saleId: 1,
            allowedTransitions: [SaleStatus.APPROVED],
          })
        )
      ).rejects.toThrow(SaleNotCancellableError);

      expect(repo.cancel).not.toHaveBeenCalled();
    });

    it('should map invalid transition errors to SaleNotCancellableError', async () => {
      const useCase = TestBed.inject(CancelSaleUseCase);
      repo.cancel.mockReturnValue(
        throwError(() => new SaleInvalidStatusTransitionError())
      );

      await expect(firstValueFrom(useCase.execute(SALE_DETAIL_MOCK))).rejects.toThrow(
        SaleNotCancellableError
      );
    });
  });

  describe('DeleteSaleUseCase', () => {
    it('should delete pending sales', async () => {
      const useCase = TestBed.inject(DeleteSaleUseCase);
      repo.delete.mockReturnValue(of(void 0));

      await firstValueFrom(useCase.execute(SALE_DETAIL_MOCK));

      expect(repo.delete).toHaveBeenCalledWith(1);
    });

    it('should reject non-pending sales', async () => {
      const useCase = TestBed.inject(DeleteSaleUseCase);

      await expect(
        firstValueFrom(
          useCase.execute({
            saleId: 1,
            status: SaleStatus.APPROVED,
          })
        )
      ).rejects.toThrow(SaleNotDeletableError);

      expect(repo.delete).not.toHaveBeenCalled();
    });
  });
});

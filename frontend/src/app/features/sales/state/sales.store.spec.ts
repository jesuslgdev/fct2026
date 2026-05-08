import { WritableSignal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@core/services/auth.service';
import { of, throwError } from 'rxjs';
import { Client, PagedResult } from '@domain/models/client.model';
import { SaleStatus } from '@domain/enums/sale-status.enum';
import {
  SaleApiError,
  SaleForbiddenError,
  SaleNotDeletableError,
  SaleValidationError,
} from '@domain/models/sale-errors';
import { Sale } from '@domain/models/sale.model';
import { GetClientsUseCase } from '@domain/usecases/client/get-clients.usecase';
import { AdvanceSaleStatusUseCase } from '@domain/usecases/sales/advance-sale-status.usecase';
import { DeleteSaleUseCase } from '@domain/usecases/sales/delete-sale.usecase';
import { ListSalesUseCase } from '@domain/usecases/sales/list-sales.usecase';
import { SalesStore } from '@features/sales/state/sales.store';

const SALE_A: Sale = {
  saleId: 1,
  saleNumber: 'VEN-2026-0001',
  clientId: 1,
  warehouseId: 1,
  clientName: 'Cliente A',
  creatorName: 'Vendedor A',
  status: SaleStatus.PENDING,
  allowedTransitions: [SaleStatus.APPROVED, SaleStatus.CANCELLED],
  deliveryAddress: 'Calle Mayor 1, Madrid',
  saleDate: new Date('2026-04-01T10:00:00.000Z'),
  createdAt: new Date('2026-04-01T10:01:00.000Z'),
  total: 100,
};

const SALE_B: Sale = {
  saleId: 2,
  saleNumber: 'VEN-2026-0002',
  clientId: 2,
  warehouseId: 1,
  clientName: null,
  creatorName: 'Vendedor B',
  status: SaleStatus.APPROVED,
  allowedTransitions: [SaleStatus.IN_PROCESS, SaleStatus.CANCELLED],
  deliveryAddress: 'Gran Via 2, Barcelona',
  saleDate: new Date('2026-04-02T10:00:00.000Z'),
  createdAt: new Date('2026-04-02T10:01:00.000Z'),
  total: 250,
};

const CLIENT_A: Client = {
  clientId: 1,
  name: 'Cliente A',
  taxId: '12345678A',
  city: 'Madrid',
  isActive: true,
};

const CLIENT_B: Client = {
  clientId: 2,
  name: 'Cliente B',
  taxId: '87654321B',
  city: 'Barcelona',
  isActive: true,
};

class MockListSalesUseCase {
  execute = vi.fn().mockImplementation(() =>
    of({
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
    }),
  );
}

class MockGetClientsUseCase {
  execute = vi.fn().mockImplementation(() =>
    of({
      data: [],
      total: 0,
      page: 1,
      pageSize: 100,
    }),
  );
}

class MockAdvanceSaleStatusUseCase {
  execute = vi.fn().mockReturnValue(of({
    ...SALE_A,
    status: SaleStatus.CANCELLED,
    allowedTransitions: [],
  }));
}

class MockDeleteSaleUseCase {
  execute = vi.fn().mockReturnValue(of(void 0));
}

class MockAuthService {
  hasPermission = vi.fn().mockReturnValue(true);
}

describe('SalesStore', () => {
  let store: SalesStore;
  let listSalesUseCase: MockListSalesUseCase;
  let getClientsUseCase: MockGetClientsUseCase;
  let advanceSaleStatusUseCase: MockAdvanceSaleStatusUseCase;
  let deleteSaleUseCase: MockDeleteSaleUseCase;
  let authService: MockAuthService;

  const setSalesState = (sales: Sale[]): void => {
    (
      store as unknown as {
        salesState: WritableSignal<Sale[]>;
      }
    ).salesState.set(sales);
  };

  beforeEach(() => {
    listSalesUseCase = new MockListSalesUseCase();
    getClientsUseCase = new MockGetClientsUseCase();
    advanceSaleStatusUseCase = new MockAdvanceSaleStatusUseCase();
    deleteSaleUseCase = new MockDeleteSaleUseCase();
    authService = new MockAuthService();

    TestBed.configureTestingModule({
      providers: [
        SalesStore,
        { provide: AuthService, useValue: authService as unknown as AuthService },
        { provide: ListSalesUseCase, useValue: listSalesUseCase as unknown as ListSalesUseCase },
        { provide: GetClientsUseCase, useValue: getClientsUseCase as unknown as GetClientsUseCase },
        {
          provide: AdvanceSaleStatusUseCase,
          useValue: advanceSaleStatusUseCase as unknown as AdvanceSaleStatusUseCase,
        },
        { provide: DeleteSaleUseCase, useValue: deleteSaleUseCase as unknown as DeleteSaleUseCase },
      ],
    });

    store = TestBed.inject(SalesStore);
  });

  it('loads sales with default pagination and sorting', async () => {
    const response: PagedResult<Sale> = {
      data: [SALE_A, SALE_B],
      total: 2,
      page: 1,
      pageSize: 20,
    };
    listSalesUseCase.execute.mockReturnValueOnce(of(response));

    await store.loadSales();

    expect(listSalesUseCase.execute).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      sortField: 'created_at',
      sortOrder: 'desc',
      status: undefined,
      clientId: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });
    expect(store.sales()).toEqual([SALE_A, SALE_B]);
    expect(store.total()).toBe(2);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('loads sales with combinable filters', async () => {
    const dateFrom = new Date('2026-04-01T00:00:00.000Z');
    listSalesUseCase.execute.mockReturnValue(
      of({ data: [SALE_A], total: 1, page: 1, pageSize: 20 }),
    );

    await store.onStatusFilterChange(SaleStatus.APPROVED);
    await store.onClientFilterChange(7);
    const dateToInput = new Date('2026-04-30');
    const expectedDateTo = new Date(dateToInput);
    expectedDateTo.setHours(23, 59, 59, 999);
    await store.onDateFromFilterChange(dateFrom);
    await store.onDateToFilterChange(dateToInput);

    await store.loadSales();

    expect(listSalesUseCase.execute).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 20,
      sortField: 'created_at',
      sortOrder: 'desc',
      status: SaleStatus.APPROVED,
      clientId: 7,
      dateFrom,
      dateTo: expectedDateTo,
    });
  });

  it('maps sale forbidden error to a specific message', async () => {
    listSalesUseCase.execute.mockReturnValueOnce(throwError(() => new SaleForbiddenError()));

    await store.loadSales();

    expect(store.error()).toBe('No tienes permisos para consultar las ventas.');
  });

  it('maps sale validation error to backend message', async () => {
    listSalesUseCase.execute.mockReturnValueOnce(
      throwError(() => new SaleValidationError({ field: 'dateRange' }, 'Date range is invalid.')),
    );

    await store.loadSales();

    expect(store.error()).toBe('Date range is invalid.');
  });

  it('maps sale api error to service message', async () => {
    listSalesUseCase.execute.mockReturnValueOnce(
      throwError(() => new SaleApiError('Service unavailable')),
    );

    await store.loadSales();

    expect(store.error()).toBe('Service unavailable');
  });

  it('exposes the filtered empty message when there are no results', async () => {
    listSalesUseCase.execute.mockReturnValue(
      of({ data: [], total: 0, page: 1, pageSize: 20 }),
    );

    await store.onStatusFilterChange(SaleStatus.PENDING);

    expect(store.emptyMessage()).toBe('No se encontraron ventas con los filtros aplicados');
  });

  it('does not expose the filtered empty message without active filters', async () => {
    listSalesUseCase.execute.mockReturnValueOnce(
      of({ data: [], total: 0, page: 1, pageSize: 20 }),
    );

    await store.loadSales();

    expect(store.emptyMessage()).toBeNull();
  });

  it('maps sales view with the fields required by the listing', () => {
    listSalesUseCase.execute.mockReturnValueOnce(
      of({ data: [SALE_A, SALE_B], total: 2, page: 1, pageSize: 20 }),
    );

    return store.loadSales().then(() => {
      expect(store.salesView()).toEqual([
        {
          saleId: 1,
          saleNumber: 'VEN-2026-0001',
          clientName: 'Cliente A',
          status: SaleStatus.PENDING,
          allowedTransitions: [SaleStatus.APPROVED, SaleStatus.CANCELLED],
          deliveryAddress: 'Calle Mayor 1, Madrid',
          createdAt: SALE_A.createdAt,
          total: 100,
        },
        {
          saleId: 2,
          saleNumber: 'VEN-2026-0002',
          clientName: '-',
          status: SaleStatus.APPROVED,
          allowedTransitions: [SaleStatus.IN_PROCESS, SaleStatus.CANCELLED],
          deliveryAddress: 'Gran Via 2, Barcelona',
          createdAt: SALE_B.createdAt,
          total: 250,
        },
      ]);
    });
  });

  it('loads clients for the client filter', async () => {
    getClientsUseCase.execute.mockReturnValueOnce(
      of({ data: [CLIENT_A, CLIENT_B], total: 2, page: 1, pageSize: 100 }),
    );

    await store.loadClientsForFilter();

    expect(getClientsUseCase.execute).toHaveBeenCalledWith({
      page: 1,
      pageSize: 100,
    });
    expect(store.clients()).toEqual([CLIENT_A, CLIENT_B]);
    expect(store.clientsLoading()).toBe(false);
    expect(store.clientsError()).toBeNull();
  });

  it('loads all client pages for the client filter', async () => {
    getClientsUseCase.execute
      .mockReturnValueOnce(
        of({ data: [CLIENT_A], total: 2, page: 1, pageSize: 100 }),
      )
      .mockReturnValueOnce(
        of({ data: [CLIENT_B], total: 2, page: 2, pageSize: 100 }),
      );

    await store.loadClientsForFilter();

    expect(getClientsUseCase.execute).toHaveBeenNthCalledWith(1, {
      page: 1,
      pageSize: 100,
    });
    expect(getClientsUseCase.execute).toHaveBeenNthCalledWith(2, {
      page: 2,
      pageSize: 100,
    });
    expect(store.clients()).toEqual([CLIENT_A, CLIENT_B]);
  });

  it('sets error when loading clients for filter fails', async () => {
    getClientsUseCase.execute.mockReturnValueOnce(throwError(() => new Error('boom')));

    await store.loadClientsForFilter();

    expect(store.clientsError()).toBe('No se pudieron cargar los clientes para el filtro.');
    expect(store.clientsLoading()).toBe(false);
  });

  it('status filter change resets page and triggers load', () => {
    const spy = vi.spyOn(store, 'loadSales').mockResolvedValue();
    store.onPageChange({ first: 80, rows: 20 });
    spy.mockClear();

    store.onStatusFilterChange(SaleStatus.APPROVED);

    expect(store.statusFilter()).toBe(SaleStatus.APPROVED);
    expect(store.page()).toBe(1);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('client filter change resets page and triggers load', () => {
    const spy = vi.spyOn(store, 'loadSales').mockResolvedValue();
    store.onPageChange({ first: 60, rows: 20 });
    spy.mockClear();

    store.onClientFilterChange(2);

    expect(store.clientFilter()).toBe(2);
    expect(store.page()).toBe(1);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('client filter accepts null to represent all clients', () => {
    const spy = vi.spyOn(store, 'loadSales').mockResolvedValue();
    store.onClientFilterChange(2);
    spy.mockClear();

    store.onClientFilterChange(null);

    expect(store.clientFilter()).toBeNull();
    expect(store.page()).toBe(1);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('date from filter change resets page and triggers load', () => {
    const spy = vi.spyOn(store, 'loadSales').mockResolvedValue();
    const dateFrom = new Date('2026-04-01T00:00:00.000Z');
    store.onPageChange({ first: 40, rows: 20 });
    spy.mockClear();

    store.onDateFromFilterChange(dateFrom);

    expect(store.dateFromFilter()).toEqual(dateFrom);
    expect(store.page()).toBe(1);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('date to filter change resets page and triggers load', () => {
    const spy = vi.spyOn(store, 'loadSales').mockResolvedValue();
    const dateTo = new Date('2026-04-30');
    const expectedDateTo = new Date(dateTo);
    expectedDateTo.setHours(23, 59, 59, 999);
    store.onPageChange({ first: 40, rows: 20 });
    spy.mockClear();

    store.onDateToFilterChange(dateTo);

    expect(store.dateToFilter()).toEqual(expectedDateTo);
    expect(store.page()).toBe(1);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('clear filters resets all filters and reloads first page', () => {
    const spy = vi.spyOn(store, 'loadSales').mockResolvedValue();
    store.onPageChange({ first: 40, rows: 20 });
    store.onStatusFilterChange(SaleStatus.PENDING);
    store.onClientFilterChange(2);
    store.onDateFromFilterChange(new Date('2026-04-01T00:00:00.000Z'));
    store.onDateToFilterChange(new Date('2026-04-30T23:59:59.000Z'));
    spy.mockClear();

    store.clearFilters();

    expect(store.statusFilter()).toBeNull();
    expect(store.clientFilter()).toBeNull();
    expect(store.dateFromFilter()).toBeNull();
    expect(store.dateToFilter()).toBeNull();
    expect(store.page()).toBe(1);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('page change updates pagination and triggers load', () => {
    const spy = vi.spyOn(store, 'loadSales').mockResolvedValue();

    store.onPageChange({ first: 20, rows: 20 });

    expect(store.page()).toBe(2);
    expect(store.pageSize()).toBe(20);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('calculates total pages from total and page size', () => {
    listSalesUseCase.execute.mockReturnValueOnce(
      of({ data: [SALE_A], total: 45, page: 1, pageSize: 20 }),
    );

    return store.loadSales().then(() => {
      expect(store.totalPages()).toBe(3);
    });
  });

  it('computes management actions from permission and loaded sale state', () => {
    setSalesState([SALE_A, SALE_B]);

    expect(store.canManageSales()).toBe(true);
    expect(store.canEditSale(1)).toBe(true);
    expect(store.canEditSale(2)).toBe(false);
    expect(store.canChangeStatus(1)).toBe(true);
    expect(store.canAdvanceSaleStatus(1)).toBe(true);
    expect(store.canCancelSale(1)).toBe(true);
    expect(store.canDeleteSale(1)).toBe(true);
    expect(store.canChangeStatus(2)).toBe(true);
    expect(store.canAdvanceSaleStatus(2)).toBe(true);
    expect(store.canCancelSale(2)).toBe(true);
    expect(store.canDeleteSale(2)).toBe(false);
    expect(store.getNextLifecycleStatus(1)).toBe(SaleStatus.APPROVED);
    expect(store.getNextLifecycleStatus(2)).toBe(SaleStatus.IN_PROCESS);
  });

  it('blocks management actions when the user lacks permission', async () => {
    authService.hasPermission.mockReturnValue(false);
    setSalesState([SALE_A, SALE_B]);

    expect(store.canManageSales()).toBe(false);
    expect(store.canEditSale(1)).toBe(false);
    expect(store.canChangeStatus(1)).toBe(false);
    expect(store.canAdvanceSaleStatus(1)).toBe(false);
    expect(store.canCancelSale(1)).toBe(false);
    expect(store.canDeleteSale(1)).toBe(false);

    await store.changeSaleStatus(1, SaleStatus.CANCELLED);
    await store.deleteSale(1);

    expect(advanceSaleStatusUseCase.execute).not.toHaveBeenCalled();
    expect(deleteSaleUseCase.execute).not.toHaveBeenCalled();
  });

  it('changes sale status and refreshes the listing', async () => {
    setSalesState([SALE_A]);
    const loadSpy = vi.spyOn(store, 'loadSales').mockResolvedValue();

    await store.changeSaleStatus(1, SaleStatus.CANCELLED);

    expect(advanceSaleStatusUseCase.execute).toHaveBeenCalledWith(1, {
      newStatus: SaleStatus.CANCELLED,
    });
    expect(store.successMessage()).toBe('La venta se ha cancelado correctamente.');
    expect(loadSpy).toHaveBeenCalledOnce();
  });

  it('blocks unsupported status changes even when the sale is loaded', async () => {
    setSalesState([SALE_A]);

    await store.changeSaleStatus(1, SaleStatus.DELIVERED);

    expect(advanceSaleStatusUseCase.execute).not.toHaveBeenCalled();
  });

  it('maps status-specific success messages', async () => {
    setSalesState([SALE_A]);
    const loadSpy = vi.spyOn(store, 'loadSales').mockResolvedValue();

    await store.changeSaleStatus(1, SaleStatus.APPROVED);

    expect(store.successMessage()).toBe('La venta se ha aprobado correctamente.');
    expect(loadSpy).toHaveBeenCalledOnce();
  });

  it('deletes a sale and refreshes the listing', async () => {
    setSalesState([SALE_A]);
    const loadSpy = vi.spyOn(store, 'loadSales').mockResolvedValue();

    await store.deleteSale(1);

    expect(deleteSaleUseCase.execute).toHaveBeenCalledWith(SALE_A);
    expect(store.successMessage()).toBe('La venta se ha eliminado correctamente.');
    expect(loadSpy).toHaveBeenCalledOnce();
  });

  it('maps change-status action errors to a friendly message', async () => {
    setSalesState([SALE_A]);
    advanceSaleStatusUseCase.execute.mockReturnValueOnce(
      throwError(() => new SaleValidationError({}, 'Invalid sale status transition.')),
    );

    await store.changeSaleStatus(1, SaleStatus.CANCELLED);

    expect(store.error()).toBe('Invalid sale status transition.');
  });

  it('maps delete action errors to a friendly message', async () => {
    setSalesState([SALE_A]);
    deleteSaleUseCase.execute.mockReturnValueOnce(
      throwError(() => new SaleNotDeletableError()),
    );

    await store.deleteSale(1);

    expect(store.error()).toBe('Solo se pueden eliminar ventas pendientes.');
  });
});

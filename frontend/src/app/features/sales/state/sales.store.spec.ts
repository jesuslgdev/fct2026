import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Client, PagedResult } from '@domain/models/client.model';
import { SaleStatus } from '@domain/enums/sale-status.enum';
import { SaleApiError, SaleForbiddenError, SaleValidationError } from '@domain/models/sale-errors';
import { Sale } from '@domain/models/sale.model';
import { GetClientsUseCase } from '@domain/usecases/client/get-clients.usecase';
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

describe('SalesStore', () => {
  let store: SalesStore;
  let listSalesUseCase: MockListSalesUseCase;
  let getClientsUseCase: MockGetClientsUseCase;

  beforeEach(() => {
    listSalesUseCase = new MockListSalesUseCase();
    getClientsUseCase = new MockGetClientsUseCase();

    TestBed.configureTestingModule({
      providers: [
        SalesStore,
        { provide: ListSalesUseCase, useValue: listSalesUseCase as unknown as ListSalesUseCase },
        { provide: GetClientsUseCase, useValue: getClientsUseCase as unknown as GetClientsUseCase },
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
    const dateTo = new Date('2026-04-30T23:59:59.000Z');
    listSalesUseCase.execute.mockReturnValueOnce(
      of({ data: [SALE_A], total: 1, page: 1, pageSize: 20 }),
    );

    store.statusFilter.set(SaleStatus.APPROVED);
    store.clientFilter.set(7);
    store.dateFromFilter.set(dateFrom);
    store.dateToFilter.set(dateTo);

    await store.loadSales();

    expect(listSalesUseCase.execute).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      sortField: 'created_at',
      sortOrder: 'desc',
      status: SaleStatus.APPROVED,
      clientId: 7,
      dateFrom,
      dateTo,
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
    listSalesUseCase.execute.mockReturnValueOnce(
      of({ data: [], total: 0, page: 1, pageSize: 20 }),
    );

    store.statusFilter.set(SaleStatus.PENDING);

    await store.loadSales();

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
    store.sales.set([SALE_A, SALE_B]);

    expect(store.salesView()).toEqual([
      {
        saleId: 1,
        saleNumber: 'VEN-2026-0001',
        clientName: 'Cliente A',
        status: SaleStatus.PENDING,
        deliveryAddress: 'Calle Mayor 1, Madrid',
        createdAt: SALE_A.createdAt,
        total: 100,
      },
      {
        saleId: 2,
        saleNumber: 'VEN-2026-0002',
        clientName: '-',
        status: SaleStatus.APPROVED,
        deliveryAddress: 'Gran Via 2, Barcelona',
        createdAt: SALE_B.createdAt,
        total: 250,
      },
    ]);
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

  it('sets error when loading clients for filter fails', async () => {
    getClientsUseCase.execute.mockReturnValueOnce(throwError(() => new Error('boom')));

    await store.loadClientsForFilter();

    expect(store.clientsError()).toBe('No se pudieron cargar los clientes para el filtro.');
    expect(store.clientsLoading()).toBe(false);
  });

  it('status filter change resets page and triggers load', () => {
    const spy = vi.spyOn(store, 'loadSales').mockResolvedValue();
    store.page.set(5);

    store.onStatusFilterChange(SaleStatus.APPROVED);

    expect(store.statusFilter()).toBe(SaleStatus.APPROVED);
    expect(store.page()).toBe(1);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('client filter change resets page and triggers load', () => {
    const spy = vi.spyOn(store, 'loadSales').mockResolvedValue();
    store.page.set(4);

    store.onClientFilterChange(2);

    expect(store.clientFilter()).toBe(2);
    expect(store.page()).toBe(1);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('date from filter change resets page and triggers load', () => {
    const spy = vi.spyOn(store, 'loadSales').mockResolvedValue();
    const dateFrom = new Date('2026-04-01T00:00:00.000Z');
    store.page.set(3);

    store.onDateFromFilterChange(dateFrom);

    expect(store.dateFromFilter()).toEqual(dateFrom);
    expect(store.page()).toBe(1);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('date to filter change resets page and triggers load', () => {
    const spy = vi.spyOn(store, 'loadSales').mockResolvedValue();
    const dateTo = new Date('2026-04-30T23:59:59.000Z');
    store.page.set(3);

    store.onDateToFilterChange(dateTo);

    expect(store.dateToFilter()).toEqual(dateTo);
    expect(store.page()).toBe(1);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('clear filters resets all filters and reloads first page', () => {
    const spy = vi.spyOn(store, 'loadSales').mockResolvedValue();
    store.page.set(3);
    store.statusFilter.set(SaleStatus.PENDING);
    store.clientFilter.set(2);
    store.dateFromFilter.set(new Date('2026-04-01T00:00:00.000Z'));
    store.dateToFilter.set(new Date('2026-04-30T23:59:59.000Z'));

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
    store.total.set(45);
    store.pageSize.set(20);

    expect(store.totalPages()).toBe(3);
  });
});

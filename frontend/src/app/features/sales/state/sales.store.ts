import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SaleStatus } from '@domain/enums/sale-status.enum';
import { SaleApiError, SaleForbiddenError, SaleUnauthorizedError, SaleValidationError } from '@domain/models/sale-errors';
import { ListSalesFilters, Sale, SaleSortField } from '@domain/models/sale.model';
import { Client } from '@domain/models/client.model';
import { GetClientsUseCase } from '@domain/usecases/client/get-clients.usecase';
import { ListSalesUseCase } from '@domain/usecases/sales/list-sales.usecase';

export interface SaleListItemView {
  saleId: number;
  saleNumber: string;
  clientName: string;
  status: SaleStatus;
  deliveryAddress: string;
  createdAt: Date;
  total: number;
}

@Injectable()
export class SalesStore {
  private readonly listSalesUseCase = inject(ListSalesUseCase);
  private readonly getClientsUseCase = inject(GetClientsUseCase);
  private readonly clientsPageSize = 100;

  private readonly salesState = signal<Sale[]>([]);
  private readonly totalState = signal(0);
  private readonly pageState = signal(1);
  private readonly pageSizeState = signal(20);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  private readonly statusFilterState = signal<SaleStatus | null>(null);
  private readonly clientFilterState = signal<number | null>(null);
  private readonly dateFromFilterState = signal<Date | null>(null);
  private readonly dateToFilterState = signal<Date | null>(null);
  private readonly sortFieldState = signal<SaleSortField>('created_at');
  private readonly sortOrderState = signal<'asc' | 'desc'>('desc');

  private readonly clientsState = signal<Client[]>([]);
  private readonly clientsLoadingState = signal(false);
  private readonly clientsErrorState = signal<string | null>(null);

  readonly sales = this.salesState.asReadonly();
  readonly total = this.totalState.asReadonly();
  readonly page = this.pageState.asReadonly();
  readonly pageSize = this.pageSizeState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly statusFilter = this.statusFilterState.asReadonly();
  readonly clientFilter = this.clientFilterState.asReadonly();
  readonly dateFromFilter = this.dateFromFilterState.asReadonly();
  readonly dateToFilter = this.dateToFilterState.asReadonly();
  readonly sortField = this.sortFieldState.asReadonly();
  readonly sortOrder = this.sortOrderState.asReadonly();

  readonly clients = this.clientsState.asReadonly();
  readonly clientsLoading = this.clientsLoadingState.asReadonly();
  readonly clientsError = this.clientsErrorState.asReadonly();

  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));

  readonly hasActiveFilters = computed(
    () =>
      this.statusFilter() !== null
      || this.clientFilter() !== null
      || this.dateFromFilter() !== null
      || this.dateToFilter() !== null,
  );

  readonly salesView = computed<SaleListItemView[]>(() =>
    this.sales().map((sale) => ({
      saleId: sale.saleId,
      saleNumber: sale.saleNumber,
      clientName: sale.clientName ?? '-',
      status: sale.status,
      deliveryAddress: sale.deliveryAddress,
      createdAt: sale.createdAt,
      total: sale.total,
    })),
  );

  readonly emptyMessage = computed(() =>
    !this.loading() && this.sales().length === 0 && this.hasActiveFilters()
      ? 'No se encontraron ventas con los filtros aplicados'
      : null,
  );

  private resolveErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof SaleValidationError) {
      return err.message || 'Revisa los filtros aplicados.';
    }

    if (err instanceof SaleUnauthorizedError) {
      return 'Tu sesion ha expirado. Vuelve a iniciar sesion.';
    }

    if (err instanceof SaleForbiddenError) {
      return 'No tienes permisos para consultar las ventas.';
    }

    if (err instanceof SaleApiError) {
      return err.message || fallback;
    }

    return fallback;
  }

  async loadSales(): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const filters: ListSalesFilters = {
        page: this.page(),
        pageSize: this.pageSize(),
        sortField: this.sortField(),
        sortOrder: this.sortOrder(),
        status: this.statusFilter() ?? undefined,
        clientId: this.clientFilter() ?? undefined,
        dateFrom: this.dateFromFilter() ?? undefined,
        dateTo: this.dateToFilter() ?? undefined,
      };

      const result = await firstValueFrom(this.listSalesUseCase.execute(filters));
      this.salesState.set(result.data);
      this.totalState.set(result.total);
    } catch (err) {
      this.errorState.set(this.resolveErrorMessage(err, 'No se pudieron cargar las ventas.'));
    } finally {
      this.loadingState.set(false);
    }
  }

  async loadClientsForFilter(): Promise<void> {
    this.clientsLoadingState.set(true);
    this.clientsErrorState.set(null);

    try {
      const clients: Client[] = [];
      let page = 1;
      let total = 0;

      do {
        const result = await firstValueFrom(
          this.getClientsUseCase.execute({
            page,
            pageSize: this.clientsPageSize,
          }),
        );

        clients.push(...result.data);
        total = result.total;
        page += 1;
      } while (clients.length < total);

      this.clientsState.set(clients);
    } catch {
      this.clientsErrorState.set('No se pudieron cargar los clientes para el filtro.');
    } finally {
      this.clientsLoadingState.set(false);
    }
  }

  onStatusFilterChange(status: SaleStatus | null): void {
    this.statusFilterState.set(status);
    this.pageState.set(1);
    void this.loadSales();
  }

  onClientFilterChange(clientId: number | null): void {
    this.clientFilterState.set(clientId);
    this.pageState.set(1);
    void this.loadSales();
  }

  onDateFromFilterChange(dateFrom: Date | null): void {
    this.dateFromFilterState.set(dateFrom);
    this.pageState.set(1);
    void this.loadSales();
  }

  onDateToFilterChange(dateTo: Date | null): void {
    this.dateToFilterState.set(dateTo);
    this.pageState.set(1);
    void this.loadSales();
  }

  clearFilters(): void {
    this.statusFilterState.set(null);
    this.clientFilterState.set(null);
    this.dateFromFilterState.set(null);
    this.dateToFilterState.set(null);
    this.pageState.set(1);
    void this.loadSales();
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.pageState.set(Math.floor(event.first / event.rows) + 1);
    this.pageSizeState.set(event.rows);
    void this.loadSales();
  }
}

import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SaleStatus } from '@domain/enums/sale-status.enum';
import {
  SaleApiError,
  SaleForbiddenError,
  SaleNotDeletableError,
  SaleUnauthorizedError,
  SaleValidationError,
} from '@domain/models/sale-errors';
import { ListSalesFilters, Sale, SaleSortField } from '@domain/models/sale.model';
import { Client } from '@domain/models/client.model';
import { GetClientsUseCase } from '@domain/usecases/client/get-clients.usecase';
import { AdvanceSaleStatusUseCase } from '@domain/usecases/sales/advance-sale-status.usecase';
import { DeleteSaleUseCase } from '@domain/usecases/sales/delete-sale.usecase';
import { ListSalesUseCase } from '@domain/usecases/sales/list-sales.usecase';

export interface SaleListItemView {
  saleId: number;
  saleNumber: string;
  clientName: string;
  status: SaleStatus;
  allowedTransitions: SaleStatus[];
  deliveryAddress: string;
  createdAt: Date;
  total: number;
}

@Injectable()
export class SalesStore {
  private readonly listSalesUseCase = inject(ListSalesUseCase);
  private readonly getClientsUseCase = inject(GetClientsUseCase);
  private readonly advanceSaleStatusUseCase = inject(AdvanceSaleStatusUseCase);
  private readonly deleteSaleUseCase = inject(DeleteSaleUseCase);

  readonly sales = signal<Sale[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly loading = signal(false);
  readonly changingStatusSaleId = signal<number | null>(null);
  readonly deletingSaleId = signal<number | null>(null);
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly statusFilter = signal<SaleStatus | null>(null);
  readonly clientFilter = signal<number | null>(null);
  readonly dateFromFilter = signal<Date | null>(null);
  readonly dateToFilter = signal<Date | null>(null);
  readonly sortField = signal<SaleSortField>('created_at');
  readonly sortOrder = signal<'asc' | 'desc'>('desc');

  readonly clients = signal<Client[]>([]);
  readonly clientsLoading = signal(false);
  readonly clientsError = signal<string | null>(null);

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
      allowedTransitions: sale.allowedTransitions,
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
    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);

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
      this.sales.set(result.data);
      this.total.set(result.total);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'No se pudieron cargar las ventas.'));
    } finally {
      this.loading.set(false);
    }
  }

  async loadClientsForFilter(): Promise<void> {
    this.clientsLoading.set(true);
    this.clientsError.set(null);

    try {
      const result = await firstValueFrom(
        this.getClientsUseCase.execute({
          page: 1,
          pageSize: 100,
        }),
      );

      this.clients.set(result.data);
    } catch {
      this.clientsError.set('No se pudieron cargar los clientes para el filtro.');
    } finally {
      this.clientsLoading.set(false);
    }
  }

  onStatusFilterChange(status: SaleStatus | null): void {
    this.statusFilter.set(status);
    this.page.set(1);
    void this.loadSales();
  }

  onClientFilterChange(clientId: number | null): void {
    this.clientFilter.set(clientId);
    this.page.set(1);
    void this.loadSales();
  }

  onDateFromFilterChange(dateFrom: Date | null): void {
    this.dateFromFilter.set(dateFrom);
    this.page.set(1);
    void this.loadSales();
  }

  onDateToFilterChange(dateTo: Date | null): void {
    this.dateToFilter.set(dateTo);
    this.page.set(1);
    void this.loadSales();
  }

  clearFilters(): void {
    this.statusFilter.set(null);
    this.clientFilter.set(null);
    this.dateFromFilter.set(null);
    this.dateToFilter.set(null);
    this.page.set(1);
    void this.loadSales();
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.page.set(Math.floor(event.first / event.rows) + 1);
    this.pageSize.set(event.rows);
    void this.loadSales();
  }

  canChangeStatus(saleId: number): boolean {
    const sale = this.findSale(saleId);
    return (sale?.allowedTransitions.length ?? 0) > 0;
  }

  canDeleteSale(saleId: number): boolean {
    const sale = this.findSale(saleId);
    return sale?.status === SaleStatus.PENDING;
  }

  isChangingStatusSale(saleId: number): boolean {
    return this.changingStatusSaleId() === saleId;
  }

  isDeletingSale(saleId: number): boolean {
    return this.deletingSaleId() === saleId;
  }

  async changeSaleStatus(saleId: number, newStatus: SaleStatus): Promise<void> {
    const sale = this.findSale(saleId);
    if (!sale || this.isChangingStatusSale(saleId)) {
      return;
    }

    this.changingStatusSaleId.set(saleId);
    this.error.set(null);
    this.successMessage.set(null);

    try {
      await firstValueFrom(
        this.advanceSaleStatusUseCase.execute(saleId, { newStatus }),
      );
      this.successMessage.set(this.resolveStatusSuccessMessage(newStatus));
      await this.loadSalesKeepingFeedback();
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'No se pudo cambiar el estado de la venta.'));
    } finally {
      this.changingStatusSaleId.set(null);
    }
  }

  async deleteSale(saleId: number): Promise<void> {
    const sale = this.findSale(saleId);
    if (!sale || this.isDeletingSale(saleId)) {
      return;
    }

    this.deletingSaleId.set(saleId);
    this.error.set(null);
    this.successMessage.set(null);

    try {
      await firstValueFrom(this.deleteSaleUseCase.execute(sale));
      this.successMessage.set('La venta se ha eliminado correctamente.');
      await this.loadSalesKeepingFeedback();
    } catch (err) {
      this.error.set(this.resolveActionError(err, 'No se pudo eliminar la venta.'));
    } finally {
      this.deletingSaleId.set(null);
    }
  }

  private findSale(saleId: number): Sale | undefined {
    return this.sales().find((sale) => sale.saleId === saleId);
  }

  private async loadSalesKeepingFeedback(): Promise<void> {
    const previousSuccessMessage = this.successMessage();
    await this.loadSales();
    this.successMessage.set(previousSuccessMessage);
  }

  private resolveActionError(err: unknown, fallback: string): string {
    if (err instanceof SaleNotDeletableError) {
      return 'Solo se pueden eliminar ventas pendientes.';
    }

    return this.resolveErrorMessage(err, fallback);
  }

  private resolveStatusSuccessMessage(newStatus: SaleStatus): string {
    switch (newStatus) {
      case SaleStatus.APPROVED:
        return 'La venta se ha aprobado correctamente.';
      case SaleStatus.IN_PROCESS:
        return 'La venta ha pasado a en proceso.';
      case SaleStatus.SHIPPED:
        return 'La venta se ha marcado como enviada.';
      case SaleStatus.DELIVERED:
        return 'La venta se ha marcado como entregada.';
      case SaleStatus.CANCELLED:
        return 'La venta se ha cancelado correctamente.';
      default:
        return 'El estado de la venta se ha actualizado correctamente.';
    }
  }
}

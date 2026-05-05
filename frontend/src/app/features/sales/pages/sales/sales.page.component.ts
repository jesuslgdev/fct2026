import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import type { TablePageEvent } from 'primeng/table';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { SaleStatus } from '@domain/enums/sale-status.enum';
import { BadgeComponent, BadgeVariant } from '@shared/ui';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { TableComponent } from '@shared/ui/table/table.component';
import { SalesStore } from '@features/sales/state/sales.store';

interface StatusOption {
  label: string;
  value: SaleStatus | null;
}

interface ClientOption {
  label: string;
  value: number | null;
}

@Component({
  selector: 'app-sales-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SalesStore],
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    DatePicker,
    Select,
    BadgeComponent,
    ButtonComponent,
    DialogComponent,
    TableComponent,
  ],
  templateUrl: './sales.page.component.html',
})
export class SalesPageComponent implements OnInit {
  readonly store = inject(SalesStore);
  readonly changeStatusDialogVisible = signal(false);
  readonly deleteDialogVisible = signal(false);
  readonly selectedSaleId = signal<number | null>(null);
  readonly selectedNextStatus = signal<SaleStatus | null>(null);
  private readonly router = inject(Router);

  readonly statusOptions: StatusOption[] = [
    { label: 'Todos los estados', value: null },
    { label: 'Pendiente', value: SaleStatus.PENDING },
    { label: 'Aprobada', value: SaleStatus.APPROVED },
    { label: 'En proceso', value: SaleStatus.IN_PROCESS },
    { label: 'Enviada', value: SaleStatus.SHIPPED },
    { label: 'Entregada', value: SaleStatus.DELIVERED },
    { label: 'Cancelada', value: SaleStatus.CANCELLED },
  ];

  readonly clientOptions = computed<ClientOption[]>(() => [
    { label: 'Todos los clientes', value: null },
    ...this.store.clients().map((client) => ({
      label: client.name,
      value: client.clientId,
    })),
  ]);

  ngOnInit(): void {
    void this.store.loadSales();
    void this.store.loadClientsForFilter();
  }

  onStatusChange(status: SaleStatus | null): void {
    this.store.onStatusFilterChange(status);
  }

  onClientChange(clientId: number | null): void {
    this.store.onClientFilterChange(clientId);
  }

  onDateFromChange(dateFrom: Date | null): void {
    this.store.onDateFromFilterChange(dateFrom);
  }

  onClearFilters(): void {
    this.store.clearFilters();
  }

  onPageChange(event: TablePageEvent): void {
    this.store.onPageChange({
      first: event.first ?? 0,
      rows: event.rows ?? this.store.pageSize(),
    });
  }

  onCreateSale(): void {
    void this.router.navigate(['/sales/new']);
  }

  onViewSale(saleId: number): void {
    void this.router.navigate(['/sales', saleId]);
  }

  onEditSale(saleId: number): void {
    void this.router.navigate(['/sales', saleId, 'edit']);
  }

  onRequestChangeStatus(saleId: number): void {
    this.selectedSaleId.set(saleId);
    this.selectedNextStatus.set(null);
    this.changeStatusDialogVisible.set(true);
  }

  onRequestDeleteSale(saleId: number): void {
    this.selectedSaleId.set(saleId);
    this.deleteDialogVisible.set(true);
  }

  onTransitionSelectionChange(status: SaleStatus | null): void {
    this.selectedNextStatus.set(status);
  }

  onConfirmChangeStatus(): void {
    const saleId = this.selectedSaleId();
    const nextStatus = this.selectedNextStatus();
    if (saleId === null || nextStatus === null) {
      return;
    }

    this.changeStatusDialogVisible.set(false);
    void this.store.changeSaleStatus(saleId, nextStatus);
  }

  onConfirmDeleteSale(): void {
    const saleId = this.selectedSaleId();
    if (saleId === null) {
      return;
    }

    this.deleteDialogVisible.set(false);
    void this.store.deleteSale(saleId);
  }

  getStatusBadgeVariant(status: SaleStatus): BadgeVariant {
    switch (status) {
      case SaleStatus.PENDING:
        return 'warning';
      case SaleStatus.APPROVED:
        return 'info';
      case SaleStatus.IN_PROCESS:
        return 'contrast';
      case SaleStatus.SHIPPED:
        return 'secondary';
      case SaleStatus.DELIVERED:
        return 'success';
      case SaleStatus.CANCELLED:
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getStatusBadgeIcon(status: SaleStatus): string {
    switch (status) {
      case SaleStatus.PENDING:
        return 'pi pi-clock';
      case SaleStatus.CANCELLED:
        return 'pi pi-times-circle';
      case SaleStatus.DELIVERED:
        return 'pi pi-check-circle';
      default:
        return 'pi pi-check';
    }
  }

  getAvailableTransitions(saleId: number): StatusOption[] {
    const sale = this.store.sales().find((item) => item.saleId === saleId);
    if (!sale) {
      return [];
    }

    return sale.allowedTransitions.map((status) => ({
      label: this.getTransitionLabel(status),
      value: status,
    }));
  }

  getCurrentSaleStatusLabel(): string {
    const saleId = this.selectedSaleId();
    const sale = saleId === null
      ? null
      : this.store.sales().find((item) => item.saleId === saleId) ?? null;

    return sale ? this.getStatusLabel(sale.status) : '-';
  }

  getSelectedTransitionImpact(): string {
    switch (this.selectedNextStatus()) {
      case SaleStatus.APPROVED:
        return 'Se congelaran las lineas y se reservara el stock.';
      case SaleStatus.CANCELLED:
        return 'La venta quedara cancelada y, si habia stock reservado, se liberara.';
      case SaleStatus.IN_PROCESS:
        return 'La venta pasara a en proceso.';
      case SaleStatus.SHIPPED:
        return 'La venta pasara a enviada.';
      case SaleStatus.DELIVERED:
        return 'La venta se marcara como entregada y se generara la salida de stock automatica.';
      default:
        return 'Selecciona una transicion para continuar.';
    }
  }

  private getTransitionLabel(status: SaleStatus): string {
    switch (status) {
      case SaleStatus.APPROVED:
        return 'Aprobar';
      case SaleStatus.CANCELLED:
        return 'Cancelar';
      case SaleStatus.IN_PROCESS:
        return 'Pasar a En proceso';
      case SaleStatus.SHIPPED:
        return 'Marcar como enviada';
      case SaleStatus.DELIVERED:
        return 'Marcar como entregada';
      default:
        return this.getStatusLabel(status);
    }
  }

  getStatusLabel(status: SaleStatus): string {
    switch (status) {
      case SaleStatus.PENDING:
        return 'Pendiente';
      case SaleStatus.APPROVED:
        return 'Aprobada';
      case SaleStatus.IN_PROCESS:
        return 'En proceso';
      case SaleStatus.SHIPPED:
        return 'Enviada';
      case SaleStatus.DELIVERED:
        return 'Entregada';
      case SaleStatus.CANCELLED:
        return 'Cancelada';
      default:
        return status;
    }
  }
}

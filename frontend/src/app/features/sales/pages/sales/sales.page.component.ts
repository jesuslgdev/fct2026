import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import type { TablePageEvent } from 'primeng/table';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { SaleStatus } from '@domain/enums/sale-status.enum';
import {
  getSaleAdvanceActionLabel,
  getSaleStatusBadgeIcon,
  getSaleStatusBadgeVariant,
  getSaleStatusImpactMessage,
  getSaleStatusLabel,
} from '@features/sales/sales-status.presentation';
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
  readonly advanceStatusDialogVisible = signal(false);
  readonly cancelDialogVisible = signal(false);
  readonly deleteDialogVisible = signal(false);
  readonly selectedSaleId = signal<number | null>(null);
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

  onDateToChange(dateTo: Date | null): void {
    this.store.onDateToFilterChange(dateTo);
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

  onRequestAdvanceStatus(saleId: number): void {
    this.selectedSaleId.set(saleId);
    this.advanceStatusDialogVisible.set(true);
  }

  onRequestCancelSale(saleId: number): void {
    this.selectedSaleId.set(saleId);
    this.cancelDialogVisible.set(true);
  }

  onRequestDeleteSale(saleId: number): void {
    this.selectedSaleId.set(saleId);
    this.deleteDialogVisible.set(true);
  }

  onConfirmAdvanceStatus(): void {
    const saleId = this.selectedSaleId();
    const nextStatus = saleId === null ? null : this.store.getNextLifecycleStatus(saleId);
    if (saleId === null || nextStatus === null) {
      return;
    }

    this.advanceStatusDialogVisible.set(false);
    void this.store.changeSaleStatus(saleId, nextStatus);
  }

  onConfirmCancelSale(): void {
    const saleId = this.selectedSaleId();
    if (saleId === null) {
      return;
    }

    this.cancelDialogVisible.set(false);
    void this.store.changeSaleStatus(saleId, SaleStatus.CANCELLED);
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
    return getSaleStatusBadgeVariant(status);
  }

  getStatusBadgeIcon(status: SaleStatus): string {
    return getSaleStatusBadgeIcon(status);
  }

  getAdvanceActionLabel(saleId: number): string {
    const nextStatus = this.store.getNextLifecycleStatus(saleId);
    return nextStatus ? getSaleAdvanceActionLabel(nextStatus) : '';
  }

  getCurrentSaleStatusLabel(): string {
    const saleId = this.selectedSaleId();
    const sale = saleId === null
      ? null
      : this.store.sales().find((item) => item.saleId === saleId) ?? null;

    return sale ? this.getStatusLabel(sale.status) : '-';
  }

  getSelectedSaleNumber(): string {
    const saleId = this.selectedSaleId();
    const sale = saleId === null
      ? null
      : this.store.sales().find((item) => item.saleId === saleId) ?? null;

    return sale?.saleNumber ?? '-';
  }

  getAdvanceStatusLabel(): string {
    const saleId = this.selectedSaleId();
    const nextStatus = saleId === null ? null : this.store.getNextLifecycleStatus(saleId);

    return nextStatus ? this.getStatusLabel(nextStatus) : '-';
  }

  getAdvanceStatusImpact(): string {
    const saleId = this.selectedSaleId();
    const nextStatus = saleId === null ? null : this.store.getNextLifecycleStatus(saleId);

    return nextStatus ? getSaleStatusImpactMessage(nextStatus) : 'Se actualizara el estado de la venta.';
  }

  getCancelStatusImpact(): string {
    return getSaleStatusImpactMessage(SaleStatus.CANCELLED);
  }

  getStatusLabel(status: SaleStatus): string {
    return getSaleStatusLabel(status);
  }
}

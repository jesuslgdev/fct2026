import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurchaseStatus } from '@domain/enums/purchase-status.enum';
import { PurchaseSortField, PurchaseSummary } from '@domain/models/purchase.model';
import { getAllowedNextPurchaseStatuses } from '@domain/models/purchase-rules';
import { PurchaseFormDialogComponent } from '@features/purchases/components/purchase-form-dialog/purchase-form-dialog.component';
import { PurchaseStatusBadgeComponent } from '@features/purchases/components/purchase-status-badge/purchase-status-badge.component';
import { PurchasesStore } from '@features/purchases/state/purchases.store';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { TableComponent } from '@shared/ui/table/table.component';
import { Select } from 'primeng/select';

interface StatusOption {
  label: string;
  value: PurchaseStatus | null;
}

interface SupplierOption {
  label: string;
  value: number | null;
}

interface SortOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-purchases-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PurchasesStore],
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    Select,
    InputComponent,
    TableComponent,
    ButtonComponent,
    DialogComponent,
    PurchaseStatusBadgeComponent,
    PurchaseFormDialogComponent,
  ],
  templateUrl: './purchases.page.component.html',
})
export class PurchasesPageComponent implements OnInit {
  readonly store = inject(PurchasesStore);

  readonly cancellationReason = signal('');

  readonly statusOptions: StatusOption[] = [
    { label: 'Todos los estados', value: null },
    { label: 'Pendiente', value: 'Pending' },
    { label: 'Aprobada', value: 'Approved' },
    { label: 'En proceso', value: 'InProcess' },
    { label: 'Enviada', value: 'Shipped' },
    { label: 'Recibida', value: 'Received' },
    { label: 'Cancelada', value: 'Cancelled' },
  ];

  readonly sortOptions: SortOption[] = [
    { label: 'Más recientes', value: 'createdAt:desc' },
    { label: 'Más antiguas', value: 'createdAt:asc' },
    { label: 'Total mayor', value: 'total:desc' },
    { label: 'Total menor', value: 'total:asc' },
    { label: 'Proveedor A-Z', value: 'supplierName:asc' },
    { label: 'Proveedor Z-A', value: 'supplierName:desc' },
    { label: 'Número A-Z', value: 'purchaseNumber:asc' },
    { label: 'Número Z-A', value: 'purchaseNumber:desc' },
  ];

  readonly supplierOptions = computed<SupplierOption[]>(() => [
    { label: 'Todos los proveedores', value: null },
    ...this.store.suppliers().map((supplier) => ({
      label: supplier.supplierName,
      value: supplier.supplierId,
    })),
  ]);

  readonly sortValue = computed(() => `${this.store.sort().field}:${this.store.sort().direction}`);
  readonly fromDate = computed(() => this.store.dateRange().from ?? '');
  readonly toDate = computed(() => this.store.dateRange().to ?? '');

  ngOnInit(): void {
    this.store.loadPurchases();
    this.store.loadFormOptions();
  }

  onSearchSupplier(value: string): void {
    this.store.onSupplierSearch(value);
  }

  onStatusChange(status: PurchaseStatus | null): void {
    this.store.onStatusFilterChange(status);
  }

  onSupplierFilterChange(supplierId: number | null): void {
    this.store.onSupplierFilterChange(supplierId);
  }

  onFromDateChange(value: string): void {
    this.store.onDateRangeChange({
      from: value || null,
      to: this.store.dateRange().to,
    });
  }

  onToDateChange(value: string): void {
    this.store.onDateRangeChange({
      from: this.store.dateRange().from,
      to: value || null,
    });
  }

  onSortChange(value: string): void {
    const [rawField, rawDirection] = value.split(':');

    if (!rawField || !rawDirection) {
      return;
    }

    const field = rawField as PurchaseSortField;
    const direction = rawDirection === 'asc' ? 'asc' : 'desc';

    this.store.onSortChange({ field, direction });
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.store.onPageChange(event);
  }

  canEditPurchase(purchase: PurchaseSummary): boolean {
    return this.store.canManage() && purchase.status === 'Pending';
  }

  canDeletePurchase(purchase: PurchaseSummary): boolean {
    return this.store.canManage() && purchase.status === 'Pending';
  }

  canCancelPurchase(purchase: PurchaseSummary): boolean {
    return this.store.canManage() && (purchase.status === 'Pending' || purchase.status === 'Approved');
  }

  canAdvanceStatus(purchase: PurchaseSummary): boolean {
    return this.store.canManage() && this.getNextLifecycleStatus(purchase.status) !== null;
  }

  nextStatusLabel(purchase: PurchaseSummary): string {
    const status = this.getNextLifecycleStatus(purchase.status);
    return status ? this.statusLabel(status) : '';
  }

  requestStatusChange(purchase: PurchaseSummary): void {
    const nextStatus = this.getNextLifecycleStatus(purchase.status);
    if (!nextStatus) {
      return;
    }

    this.store.requestStatusChange(purchase, nextStatus);
  }

  openCancelDialog(purchase: PurchaseSummary): void {
    this.cancellationReason.set('');
    this.store.requestCancelPurchase(purchase);
  }

  confirmCancelPurchase(): void {
    const reason = this.cancellationReason().trim();
    this.store.confirmCancelPurchase(reason || undefined);
    this.cancellationReason.set('');
  }

  closeCancelDialog(): void {
    this.cancellationReason.set('');
    this.store.cancelCancelPurchase();
  }

  onDeleteDialogVisibleChange(visible: boolean): void {
    if (!visible) {
      this.store.cancelDeletePurchase();
    }
  }

  onCancelDialogVisibleChange(visible: boolean): void {
    if (!visible) {
      this.closeCancelDialog();
    }
  }

  onStatusDialogVisibleChange(visible: boolean): void {
    if (!visible) {
      this.store.cancelStatusChange();
    }
  }

  statusLabel(status: PurchaseStatus): string {
    switch (status) {
      case 'Pending':
        return 'Pendiente';
      case 'Approved':
        return 'Aprobada';
      case 'InProcess':
        return 'En proceso';
      case 'Shipped':
        return 'Enviada';
      case 'Received':
        return 'Recibida';
      case 'Cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  }

  private getNextLifecycleStatus(status: PurchaseStatus): PurchaseStatus | null {
    const allowedStatuses = getAllowedNextPurchaseStatuses(status);

    for (const allowedStatus of allowedStatuses) {
      if (allowedStatus !== 'Cancelled') {
        return allowedStatus;
      }
    }

    return null;
  }
}

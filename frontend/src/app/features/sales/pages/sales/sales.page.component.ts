import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { TablePageEvent } from 'primeng/table';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { SaleStatus } from '@domain/enums/sale-status.enum';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { TableComponent } from '@shared/ui/table/table.component';
import { SalesStore } from '@features/sales/state/sales.store';

interface StatusOption {
  label: string;
  value: SaleStatus | null;
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
    ButtonComponent,
    TableComponent,
  ],
  templateUrl: './sales.page.component.html',
})
export class SalesPageComponent implements OnInit {
  readonly store = inject(SalesStore);

  readonly statusOptions: StatusOption[] = [
    { label: 'Todos los estados', value: null },
    { label: 'Pendiente', value: SaleStatus.PENDING },
    { label: 'Aprobada', value: SaleStatus.APPROVED },
    { label: 'En proceso', value: SaleStatus.IN_PROCESS },
    { label: 'Enviada', value: SaleStatus.SHIPPED },
    { label: 'Entregada', value: SaleStatus.DELIVERED },
    { label: 'Cancelada', value: SaleStatus.CANCELLED },
  ];

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

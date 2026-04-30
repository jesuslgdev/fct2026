import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { DashboardStore } from '@features/dashboard/state/dashboard.store';
import { CardComponent } from '@shared/ui/card/card.component';
import { BadgeComponent, BadgeVariant } from '@shared/ui/badge/badge.component';
import { ButtonComponent } from '@shared/ui/button/button.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DashboardStore],
  imports: [CommonModule, CardComponent, BadgeComponent, ButtonComponent],
  templateUrl: './dashboard.page.component.html',
})
export class DashboardPageComponent implements OnInit {
  readonly store = inject(DashboardStore);

  ngOnInit(): void {
    this.store.loadDashboard();
  }

  onRefresh(): void {
    this.store.loadDashboard();
  }

  statusVariant(status: string): BadgeVariant {
    const normalized = status.trim().toLowerCase();
    const variantMap: Record<string, BadgeVariant> = {
      pending: 'warning',
      approved: 'info',
      'in process': 'secondary',
      inprocess: 'secondary',
      sent: 'secondary',
      received: 'success',
      delivered: 'success',
      cancelled: 'danger',
    };

    return variantMap[normalized] ?? 'default';
  }

  statusLabel(status: string): string {
    const normalized = status.trim().toLowerCase();
    const labelMap: Record<string, string> = {
      pending: 'Pendiente',
      approved: 'Aprobada',
      'in process': 'En Proceso',
      inprocess: 'En Proceso',
      sent: 'Enviada',
      received: 'Recibida',
      delivered: 'Entregada',
      cancelled: 'Cancelada',
    };

    return labelMap[normalized] ?? status;
  }

  lowStockClass(stockCurrent: number, stockMin: number): string {
    if (stockCurrent <= Math.max(1, Math.floor(stockMin / 2))) {
      return 'text-red-600 font-medium';
    }
    return 'text-orange-500 font-medium';
  }
}

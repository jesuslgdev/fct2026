import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PurchaseStatus } from '@domain/enums/purchase-status.enum';
import { BadgeVariant, BadgeComponent } from '@shared/ui/badge/badge.component';

@Component({
  selector: 'ui-purchase-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent],
  templateUrl: './purchase-status-badge.component.html',
})
export class PurchaseStatusBadgeComponent {
  status = input.required<PurchaseStatus>();

  readonly label = computed(() => {
    switch (this.status()) {
      case 'Pending':
        return 'Pendiente';
      case 'Approved':
        return 'Aprobada';
      case 'InProcess':
        return 'En proceso';
      case 'Sent':
        return 'Enviada';
      case 'Received':
        return 'Recibida';
      case 'Cancelled':
        return 'Cancelada';
      default:
        return this.status();
    }
  });

  readonly variant = computed<BadgeVariant>(() => {
    switch (this.status()) {
      case 'Pending':
        return 'warning';
      case 'Approved':
        return 'info';
      case 'InProcess':
        return 'secondary';
      case 'Sent':
        return 'contrast';
      case 'Received':
        return 'success';
      case 'Cancelled':
        return 'danger';
      default:
        return 'default';
    }
  });
}

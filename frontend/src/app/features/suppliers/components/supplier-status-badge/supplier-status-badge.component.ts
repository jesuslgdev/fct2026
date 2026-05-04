import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent } from '@shared/ui/badge/badge.component';
import { SupplierStatus } from '@domain/enums/supplier-status.enum';

@Component({
  selector: 'ui-supplier-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent],
  template: `
    <ui-badge [label]="label()" [variant]="variant()" />
  `,
})
export class SupplierStatusBadgeComponent {
  status = input.required<SupplierStatus>();

  readonly label = computed(() => {
    switch (this.status()) {
      case SupplierStatus.ACTIVE: return 'Activo';
      case SupplierStatus.INACTIVE: return 'Inactivo';
      default: return this.status();
    }
  });

  readonly variant = computed(() => 
    this.status() === SupplierStatus.ACTIVE ? 'success' as const : 'danger' as const
  );
}


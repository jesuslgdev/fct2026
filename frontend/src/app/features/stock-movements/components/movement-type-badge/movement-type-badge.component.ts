import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MovementType } from '@domain/models/stock-movement.model';
import { BadgeComponent } from '@shared/ui/badge/badge.component';

@Component({
  selector: 'ui-movement-type-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent],
  template: `
    <ui-badge [label]="label()" [variant]="variant()" />
  `,
})
export class MovementTypeBadgeComponent {
  movementType = input.required<MovementType>();

  readonly label = computed(() => {
    switch (this.movementType()) {
      case 'inbound':
        return 'Entrada';
      case 'outbound':
        return 'Salida';
      case 'adjustment':
        return 'Ajuste';
      default:
        return this.movementType();
    }
  });

  readonly variant = computed(() => {
    switch (this.movementType()) {
      case 'inbound':
        return 'success' as const;
      case 'outbound':
        return 'danger' as const;
      case 'adjustment':
        return 'warning' as const;
      default:
        return 'info' as const;
    }
  });
}

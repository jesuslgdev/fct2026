import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent } from '@shared/ui/badge/badge.component';

@Component({
  selector: 'ui-product-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent],
  template: `
    <div class="flex items-center gap-2">
      <ui-badge [label]="statusLabel()" [variant]="statusVariant()" />
      @if (lowStock()) {
        <ui-badge label="Stock bajo" variant="warning" />
      }
    </div>
  `,
})
export class ProductStatusBadgeComponent {
  active = input.required<boolean>();
  lowStock = input<boolean>(false);

  readonly statusLabel = computed(() => (this.active() ? 'Activo' : 'Inactivo'));
  readonly statusVariant = computed(() => (this.active() ? 'success' as const : 'danger' as const));
}

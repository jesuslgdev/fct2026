import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent } from '@shared/ui/badge/badge.component';

@Component({
  selector: 'ui-client-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent],
  template: `
    <ui-badge
      [label]="label()"
      [variant]="variant()"
    />
  `,
})
export class ClientStatusBadgeComponent {
  isActive = input.required<boolean>();

  readonly label = computed(() => (this.isActive() ? 'Activo' : 'Inactivo'));
  readonly variant = computed(() => (this.isActive() ? 'success' as const : 'danger' as const));
}

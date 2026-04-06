import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent } from '@shared/ui/badge/badge.component';

@Component({
  selector: 'ui-user-status-badge',
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
export class UserStatusBadgeComponent {
  active = input.required<boolean>();
  pendingFirstLogin = input<boolean>(false);

  readonly label = computed(() => {
    if (this.pendingFirstLogin()) {
      return 'Pendiente de primer login';
    }

    return this.active() ? 'Activo' : 'Inactivo';
  });

  readonly variant = computed(() => {
    if (this.pendingFirstLogin()) {
      return 'warning' as const;
    }

    return this.active() ? 'success' as const : 'danger' as const;
  });
}

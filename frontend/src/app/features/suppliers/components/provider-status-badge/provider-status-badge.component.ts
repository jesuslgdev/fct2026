import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent } from '@shared/ui/badge/badge.component';
import { ProviderStatus } from '@domain/enums/provider-status.enum';

@Component({
  selector: 'ui-provider-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent],
  template: `
    <ui-badge [label]="label()" [variant]="variant()" />
  `,
})
export class ProviderStatusBadgeComponent {
  status = input.required<ProviderStatus>();

  readonly label = computed(() => {
    switch (this.status()) {
      case ProviderStatus.ACTIVE: return 'Activo';
      case ProviderStatus.INACTIVE: return 'Inactivo';
      default: return this.status();
    }
  });

  readonly variant = computed(() => 
    this.status() === ProviderStatus.ACTIVE ? 'success' as const : 'danger' as const
  );
}

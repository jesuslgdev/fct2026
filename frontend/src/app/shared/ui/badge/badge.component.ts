
import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
} from '@angular/core';
import { TagModule } from 'primeng/tag';

// Badge variant types
export type BadgeVariant = 'default' | 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' | 'danger';

// Badge size types
export type BadgeSize = 'default' | 'lg';

// Variant mapping to PrimeNG Tag severity
const VARIANT_MAP: Record<BadgeVariant, { severity: 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast' | undefined }> = {
  default: { severity: undefined },
  success: { severity: 'success' },
  info: { severity: 'info' },
  warning: { severity: 'warn' },
  danger: { severity: 'danger' },
  secondary: { severity: 'secondary' },
  contrast: { severity: 'contrast' },
};

@Component({
  selector: 'ui-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TagModule],
  templateUrl: './badge.component.html',
})
export class BadgeComponent {
  // Inputs
  label = input<string>('');             // Badge text
  variant = input<BadgeVariant>('default'); // Badge variant
  size = input<BadgeSize>('default');    // Badge size
  rounded = input<boolean>(false);       // Rounded pill shape
  icon = input<string>('');              // Icon class (e.g. 'pi pi-check')

  // Computed properties
  options = computed(() => VARIANT_MAP[this.variant()]);
  sizeClass = computed(() => this.size() === 'lg' ? 'text-base px-3 py-1' : '');
}


import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  computed,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';

// Button variant types
export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';

// Button size types
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

// Variant mapping to PrimeNG options
const VARIANT_MAP: Record<ButtonVariant, {
  severity?: 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast';
  outlined?: boolean;
  text?: boolean;
  link?: boolean;
}> = {
  default: {},
  destructive: { severity: 'danger' },
  outline: { outlined: true },
  secondary: { severity: 'secondary' },
  ghost: { text: true },
  link: { link: true },
};

// Size mapping to PrimeNG options
const SIZE_MAP: Record<ButtonSize, 'small' | 'large' | undefined> = {
  default: undefined,
  sm: 'small',
  lg: 'large',
  icon: 'small',
};

@Component({
  selector: 'ui-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule],
  templateUrl: './button.component.html',
})
export class ButtonComponent {
  // Inputs
  label = input<string>(''); // Button label
  icon = input<string>(''); // Icon class
  iconPos = input<'left' | 'right' | 'top' | 'bottom'>('left'); // Icon position
  variant = input<ButtonVariant>('default'); // Button variant
  size = input<ButtonSize>('default'); // Button size
  type = input<'button' | 'submit' | 'reset'>('button'); // Button type
  disabled = input<boolean>(false); // Disabled state
  loading = input<boolean>(false); // Loading state
  rounded = input<boolean>(false); // Rounded corners
  styleClass = input<string>(''); // Custom style class

  // Output
  clicked = output<MouseEvent>(); // Emits click event

  // Computed properties
  options = computed(() => VARIANT_MAP[this.variant()]); // PrimeNG options for variant
  resolvedSize = computed(() => SIZE_MAP[this.size()]); // PrimeNG size option
}
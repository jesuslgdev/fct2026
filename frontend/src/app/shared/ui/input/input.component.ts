
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  computed,
  signal,
  forwardRef,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';

// Input variant types
export type InputVariant = 'default' | 'filled';

// Input size types
export type InputSize = 'default' | 'sm' | 'lg';

// Input state types
export type InputState = 'default' | 'error' | 'success' | 'disabled';

// Variant mapping to PrimeNG options
const VARIANT_MAP: Record<InputVariant, { variant: 'outlined' | 'filled' }> = {
  default: { variant: 'outlined' },
  filled: { variant: 'filled' },
};

// Size mapping to PrimeNG options
const SIZE_MAP: Record<InputSize, 'small' | 'large' | undefined> = {
  default: undefined,
  sm: 'small',
  lg: 'large',
};

// Icon color mapping by state (uses semantic tokens from styles.css and tailwindcss-primeui)
const STATE_ICON_COLOR: Record<InputState, string> = {
  default: 'text-surface-900',
  error: 'text-danger',
  success: 'text-success-icon',
  disabled: 'text-surface-400',
};

@Component({
  selector: 'ui-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InputText, IconField, InputIcon],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  templateUrl: './input.component.html',
})
export class InputComponent implements ControlValueAccessor {
  // Inputs
  type = input<string>('text'); // Input type
  step = input<string | null>(null); // Step for number-like inputs
  placeholder = input<string>(''); // Placeholder text
  disabled = input<boolean>(false); // Disabled state (external)
  variant = input<InputVariant>('default'); // Input variant
  size = input<InputSize>('default'); // Input size
  fluid = input<boolean>(true); // Fluid width
  styleClass = input<string>(''); // Custom style class
  iconLeft = input<string>(''); // Left icon class
  iconRight = input<string>(''); // Right icon class
  state = input<InputState>('default'); // Input state

  // Internal signal for ControlValueAccessor disabled state
  private readonly _disabledState = signal<boolean>(false);

  // Output
  valueChange = output<string>(); // Emits value changes

  // Internal value signal
  readonly value = signal<string>('');

  // ControlValueAccessor callbacks
  /* eslint-disable @typescript-eslint/no-empty-function */
  private onChange: (value: unknown) => void = () => {};
  onTouched: () => void = () => {};
  /* eslint-enable @typescript-eslint/no-empty-function */

  // Computed properties
  options = computed(() => VARIANT_MAP[this.variant()]); // PrimeNG options for variant
  resolvedSize = computed(() => SIZE_MAP[this.size()]); // PrimeNG size option
  isDisabled = computed(() => this.disabled() || this._disabledState()); // Effective disabled state
  iconColorClass = computed(() => STATE_ICON_COLOR[this.state()]); // Icon color class by state
  inputClass = computed(() => [
    this.styleClass(),
    this.state() === 'error' ? 'input-error' : '',
    this.state() === 'success' ? 'input-success' : '',
    this.state() === 'disabled' ? 'input-disabled' : '',
  ].filter(Boolean).join(' '));

  // Input event handler
  onInput(event: Event) {
    const rawValue = (event.target as HTMLInputElement).value;
    this.value.set(rawValue);

    if (this.type() === 'number') {
      if (rawValue === '') {
        this.onChange(null);
      } else {
        const parsed = Number(rawValue);
        this.onChange(Number.isFinite(parsed) ? parsed : null);
      }

      this.valueChange.emit(rawValue);
      return;
    }

    this.onChange(rawValue);
    this.valueChange.emit(rawValue);
  }

  // ControlValueAccessor methods
  writeValue(val: unknown): void {
    if (val === null || val === undefined) {
      this.value.set('');
      return;
    }

    if (typeof val === 'number') {
      this.value.set(Number.isFinite(val) ? String(val) : '');
      return;
    }

    if (typeof val === 'string') {
      this.value.set(val.toLowerCase() === 'nan' ? '' : val);
      return;
    }
    this.value.set(String(val));
  }
  registerOnChange(fn: (_: unknown) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this._disabledState.set(isDisabled);
  }
}

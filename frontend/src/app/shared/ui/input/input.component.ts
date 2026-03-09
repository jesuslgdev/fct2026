
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

// Icon color mapping by state
const STATE_ICON_COLOR: Record<InputState, string> = {
  default: 'text-neutral-900', // base icon color: black
  error: 'text-red-500',      // error state: red
  success: 'text-green-500',  // success state: green
  disabled: 'text-neutral-400', // disabled state: gray
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
  private onChange: (value: unknown) => void = () => {};
  onTouched: () => void = () => {};

  // Computed properties
  options = computed(() => VARIANT_MAP[this.variant()]); // PrimeNG options for variant
  resolvedSize = computed(() => SIZE_MAP[this.size()]); // PrimeNG size option
  isDisabled = computed(() => this.disabled() || this._disabledState()); // Effective disabled state
  iconColorClass = computed(() => STATE_ICON_COLOR[this.state()]); // Icon color class by state
  inputClass = computed(() => [
    this.styleClass(),
    this.state() === 'error' ? 'border-red-500 focus:border-red-600 focus:ring-red-200' : '',
    this.state() === 'success' ? 'border-green-500 focus:border-green-600 focus:ring-green-200' : '',
    this.state() === 'disabled' ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : '',
  ].filter(Boolean).join(' '));

  // Input event handler
  onInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.onChange(val);
    this.valueChange.emit(val);
  }

  // ControlValueAccessor methods
  writeValue(val: string): void {
    this.value.set(val ?? '');
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


import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
  forwardRef,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';

// Checkbox variant types
export type CheckboxVariant = 'default' | 'filled';

@Component({
  selector: 'ui-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CheckboxModule, FormsModule],
  templateUrl: './checkbox.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
})
export class CheckboxComponent implements ControlValueAccessor {
  // Inputs
  label = input<string>('');               // Optional label text
  inputId = input<string>('');             // For label association
  disabled = input<boolean>(false);        // External disabled state
  indeterminate = input<boolean>(false);   // Indeterminate state

  // Internal state
  readonly checked = signal<boolean>(false);
  private readonly _disabledState = signal<boolean>(false);

  // CVA callbacks
  private onChange: (value: boolean) => void = () => {};
  onTouched: () => void = () => {};

  isDisabled() {
    return this.disabled() || this._disabledState();
  }

  onModelChange(value: boolean) {
    this.checked.set(value);
    this.onChange(value);
    this.onTouched();
  }

  // ControlValueAccessor
  writeValue(value: boolean): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (_: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabledState.set(isDisabled);
  }
}

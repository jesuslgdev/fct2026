// src/app/shared/components/input/input.component.ts
// ================================================================
// Wrapper de [pInputText] de PrimeNG.
//
// Por qué un wrapper y no usar [pInputText] directamente:
//   - Mantiene la misma API coherente con el resto de ui-components
//   - Centraliza el mapeo de variantes y tamaños de PrimeNG
//   - Si mañana cambia PrimeNG, solo se toca este archivo
//
// Nota: En PrimeNG v21 InputText es una DIRECTIVA ([pInputText]),
//   no un componente. Para iconos dentro del input se usan los
//   componentes p-iconfield y p-inputicon.
// ================================================================

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

export type InputVariant = 'default' | 'filled';
export type InputSize    = 'default' | 'sm' | 'lg';

// Mapa de variantes propias → opciones de PrimeNG
const VARIANT_MAP: Record<InputVariant, { variant: 'outlined' | 'filled' }> = {
  default: { variant: 'outlined' },
  filled:  { variant: 'filled'   },
};

const SIZE_MAP: Record<InputSize, 'small' | 'large' | undefined> = {
  default: undefined,
  sm:      'small',
  lg:      'large',
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
  template: `
    <p-iconfield [iconPosition]="iconPosition()">
      @if (icon()) {
        <p-inputicon [styleClass]="icon()" />
      }
      <input
        pInputText
        [type]="type()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [variant]="options().variant"
        [pSize]="resolvedSize()"
        [fluid]="fluid()"
        [class]="styleClass()"
        [value]="value()"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
    </p-iconfield>
  `,
})
export class InputComponent implements ControlValueAccessor {
  // ── Inputs ──
  type         = input<string>('text');
  placeholder  = input<string>('');
  disabled     = input<boolean>(false);
  variant      = input<InputVariant>('default');
  size         = input<InputSize>('default');
  fluid        = input<boolean>(true);
  styleClass   = input<string>('');
  icon         = input<string>('');
  iconPosition = input<'left' | 'right'>('left');

  // ── Output ──
  valueChange = output<string>();

  // ── Internal state ──
  readonly value = signal<string>('');

  private onChange = (_: unknown) => {};
  onTouched = () => {};

  // ── Computed ──
  options      = computed(() => VARIANT_MAP[this.variant()]);
  resolvedSize = computed(() => SIZE_MAP[this.size()]);

  // ── Events ──
  onInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.onChange(val);
    this.valueChange.emit(val);
  }

  // ── ControlValueAccessor ──
  writeValue(val: string): void                    { this.value.set(val ?? ''); }
  registerOnChange(fn: (_: unknown) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void          { this.onTouched = fn; }
  setDisabledState(_: boolean): void {}
}

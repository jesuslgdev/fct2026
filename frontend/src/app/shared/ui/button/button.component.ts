// src/app/shared/components/button/button.component.ts
// ================================================================
// Wrapper de p-button de PrimeNG.
//
// Por qué un wrapper y no usar p-button directamente:
//   - Mantiene la misma API que el componente anterior (variant, size)
//   - Centraliza el mapeo de variantes a severities de PrimeNG
//   - Si mañana cambia PrimeNG, solo se toca este archivo
// ================================================================

import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  computed,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize    = 'default' | 'sm' | 'lg' | 'icon';

// Mapa de variantes propias → opciones de PrimeNG
const VARIANT_MAP: Record<ButtonVariant, {
  severity?: 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast';
  outlined?: boolean;
  text?:     boolean;
  link?:     boolean;
}> = {
  default:     {},
  destructive: { severity: 'danger' },
  outline:     { outlined: true },
  secondary:   { severity: 'secondary' },
  ghost:       { text: true },
  link:        { link: true },
};

const SIZE_MAP: Record<ButtonSize, 'small' | 'large' | undefined> = {
  default: undefined,
  sm:      'small',
  lg:      'large',
  icon:    'small',   // icon usa small + clase extra para forzar cuadrado
};

@Component({
  selector: 'ui-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule],
  template: `
    <p-button
      [label]="label()"
      [icon]="icon()"
      [iconPos]="iconPos()"
      [type]="type()"
      [disabled]="disabled()"
      [loading]="loading()"
      [severity]="options().severity"
      [outlined]="options().outlined ?? false"
      [text]="options().text ?? false"
      [link]="options().link ?? false"
      [size]="resolvedSize()"
      [rounded]="rounded()"
      [styleClass]="styleClass()"
      (onClick)="clicked.emit($event)"
    />
  `,
})
export class ButtonComponent {
  // ── Inputs ──
  label    = input<string>('');
  icon     = input<string>('');
  iconPos  = input<'left' | 'right' | 'top' | 'bottom'>('left');
  variant  = input<ButtonVariant>('default');
  size     = input<ButtonSize>('default');
  type     = input<'button' | 'submit' | 'reset'>('button');
  disabled = input<boolean>(false);
  loading  = input<boolean>(false);
  rounded  = input<boolean>(false);
  styleClass = input<string>('');

  // ── Output ──
  clicked = output<MouseEvent>();

  // ── Computed ──
  options      = computed(() => VARIANT_MAP[this.variant()]);
  resolvedSize = computed(() => SIZE_MAP[this.size()]);
}
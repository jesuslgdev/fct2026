import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';

/**
 * ButtonGroup - Componente contenedor para agrupar botones
 * Soporta orientación horizontal y vertical
 */
@Component({
  selector: 'ui-button-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div [class]="classes()" role="group" [attr.data-orientation]="orientation()"><ng-content /></div>`,
})
export class ButtonGroupComponent {
  orientation = input<'horizontal' | 'vertical'>('horizontal');

  classes = computed(() => {
    const baseClasses = 'flex w-fit items-stretch [&>*]:focus-visible:z-10 [&>*]:focus-visible:relative [&>[data-slot=select-trigger]:not([class*="w-"])]:w-fit [&>input]:flex-1 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-md has-[>[data-slot=button-group]]:gap-2';

    const orientationClasses = this.orientation() === 'horizontal'
      ? '[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none'
      : 'flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none';

    return [baseClasses, orientationClasses].join(' ');
  });
}

/**
 * ButtonGroupText - Elemento de texto dentro del grupo
 * Útil para labels o texto descriptivo
 */
@Component({
  selector: 'ui-button-group-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div [class]="classes()"><ng-content /></div>`,
})
export class ButtonGroupTextComponent {
  class = input<string>('');

  classes = computed(() => {
    const baseClasses = 'bg-muted flex items-center gap-2 rounded-md border px-4 text-sm font-medium shadow-xs [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4';
    return [baseClasses, this.class()].filter(Boolean).join(' ');
  });
}

/**
 * ButtonGroupSeparator - Separador visual entre elementos del grupo
 */
@Component({
  selector: 'ui-button-group-separator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div [class]="classes()" [attr.data-slot]="'button-group-separator'"></div>`,
})
export class ButtonGroupSeparatorComponent {
  orientation = input<'horizontal' | 'vertical'>('vertical');
  class = input<string>('');

  classes = computed(() => {
    const baseClasses = 'bg-input relative self-stretch';
    const orientationClasses = this.orientation() === 'vertical'
      ? 'h-auto w-px'
      : 'h-px w-auto';
    return [baseClasses, orientationClasses, this.class()].filter(Boolean).join(' ');
  });
}

// card.component.ts
import { ChangeDetectionStrategy, Component, Injector, TemplateRef, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'ui-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardModule],
  templateUrl: './card.component.html'
})
export class CardComponent {
  private readonly parentInjector = inject(Injector);
  protected readonly injector = this.parentInjector; // Para pasar a las plantillas

  // Inputs básicos
  header = input<string>();
  subheader = input<string>();
  style = input<Record<string, string> | null>(null);
  styleClass = input<string>('');

  // Inputs para plantillas personalizadas (TemplateRefs)
  headerTemplate = input<TemplateRef<unknown>>();
  titleTemplate = input<TemplateRef<unknown>>();
  subtitleTemplate = input<TemplateRef<unknown>>();
  footerTemplate = input<TemplateRef<unknown>>();
}
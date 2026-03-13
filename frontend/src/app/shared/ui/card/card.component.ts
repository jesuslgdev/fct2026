// card.component.ts
import { ChangeDetectionStrategy, Component, Injector, TemplateRef, inject, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'ui-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, CardModule],
  templateUrl: './card.component.html'
})
export class CardComponent {
  private readonly parentInjector = inject(Injector);
  protected readonly injector = this.parentInjector; // Passed to embedded templates

  // Basic inputs
  header = input<string>();
  subheader = input<string>();
  style = input<Record<string, string> | null>(null);
  styleClass = input<string>('');

  // Custom template inputs (TemplateRefs)
  headerTemplate = input<TemplateRef<unknown>>();
  titleTemplate = input<TemplateRef<unknown>>();
  subtitleTemplate = input<TemplateRef<unknown>>();
  footerTemplate = input<TemplateRef<unknown>>();
}
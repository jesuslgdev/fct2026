import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-google-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './google-logo.component.html',
})
export class GoogleLogoComponent {
  size = input<'sm' | 'md' | 'lg'>('md');
}

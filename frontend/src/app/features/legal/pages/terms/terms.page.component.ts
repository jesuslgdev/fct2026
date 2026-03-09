import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '@shared/ui';

@Component({
  selector: 'app-terms-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  templateUrl: './terms.page.component.html',
})
export class TermsPageComponent {
  private readonly router = inject(Router);

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}

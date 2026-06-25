import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { SignOutUseCase } from '@domain/usecases/auth/sign-out.usecase';
import { ButtonComponent, CardComponent } from '@shared/ui';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    ButtonComponent,
    CardComponent,
  ],
  templateUrl: './unauthorized.component.html'
})
export class UnauthorizedComponent {
  private readonly router = inject(Router);
  private readonly signOut = inject(SignOutUseCase);
  private readonly authService = inject(AuthService);

  async logout(): Promise<void> {
    await this.signOut.execute();
    this.authService.setSession(null);
    await this.router.navigate(['/auth/login']);
  }
}

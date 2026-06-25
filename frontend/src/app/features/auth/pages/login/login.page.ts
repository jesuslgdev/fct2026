import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent, CardComponent, GoogleLogoComponent } from '@shared/ui';
import { AuthService } from '@core/services/auth.service';
import { SignInWithGoogleUseCase } from '@domain/usecases/auth/sign-in-with-google.usecase';
import { AccessDeniedError } from '@domain/models/auth-errors';

@Component({
  selector: 'app-login-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent, ButtonComponent, GoogleLogoComponent],
  templateUrl: './login.page.html',
})
export class LoginPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly signInWithGoogle = inject(SignInWithGoogleUseCase);
  private readonly authService = inject(AuthService);

  readonly loading = signal(false);
  readonly error = signal('');

  async loginWithGoogle(): Promise<void> {
    this.error.set('');
    this.loading.set(true);
    try {
      const session = await this.signInWithGoogle.execute();
      this.authService.setSession(session);

      if (!this.authService.isAdmin()) {
        await this.router.navigateByUrl('/legal/terms');
        return;
      }

      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      const safeUrl = returnUrl?.startsWith('/') ? returnUrl : '/';
      await this.router.navigateByUrl(safeUrl);
    } catch (err) {
      if (err instanceof AccessDeniedError) {
        this.error.set('Acceso denegado. Tu cuenta no tiene permiso para acceder.');
      } else {
        this.error.set('Error al iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
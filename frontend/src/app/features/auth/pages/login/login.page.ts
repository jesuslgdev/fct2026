import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { AuthService } from '@core/services/auth.service';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { AccessDeniedError } from '@domain/models/auth-errors';

@Component({
  selector: 'auth-login-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  templateUrl: './login.page.html',
})
export class LoginPage {
  private readonly router = inject(Router);
  private readonly authRepo = inject(AuthRepository);
  private readonly authService = inject(AuthService);

  readonly loading = signal(false);
  readonly error = signal('');

  constructor() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/legal/terms']);
    }
  }

  async loginWithGoogle(): Promise<void> {
    this.error.set('');
    this.loading.set(true);
    try {
      const session = await this.authRepo.signInWithGoogle();
      this.authService.setSession(session);
      await this.router.navigate(['/legal/terms']);
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

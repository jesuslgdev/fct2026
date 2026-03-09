import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { AuthStore } from '@core/auth/auth.store';
import { AuthRepository } from '@domain/repositories/auth.repository';

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
  private readonly store = inject(AuthStore);

  readonly loading = signal(false);
  readonly error = signal('');

  readonly isAuthenticated = this.store.isAuthenticated;

  constructor() {
    // redirect immediately if user already signed in
    if (this.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  async loginWithGoogle() {
    this.error.set('');
    this.loading.set(true);
    try {
      const user = await this.authRepo.signInWithGoogle();
      this.store.setUser(user); // ensure store reflects state when using mock
      await this.router.navigate(['/dashboard']);
    } catch (err) {
      console.error(err);
      this.error.set('Error al iniciar sesión');
    } finally {
      this.loading.set(false);
    }
  }
}

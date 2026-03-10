import { Injectable, signal } from '@angular/core';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authService = inject(AuthService);

  readonly user = this.authService.user;
  readonly loading = signal(false);
  readonly isAuthenticated = this.authService.isLoggedIn;
}

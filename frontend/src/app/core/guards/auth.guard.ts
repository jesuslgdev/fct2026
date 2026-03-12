import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const authGuard: CanActivateFn = () => {
  const isLoggedIn = inject(AuthService).isLoggedIn();
  if (isLoggedIn) return true;
  return inject(Router).createUrlTree(['/auth/login']);
};

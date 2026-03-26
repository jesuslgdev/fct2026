import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);

  if (authService.isLoggedIn()) {
    if (state.url === '/' || state.url === '') {
      return inject(Router).createUrlTree([
        authService.isAdmin() ? '/departments' : '/legal/terms',
      ]);
    }
    return true;
  }

  return inject(Router).createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
};

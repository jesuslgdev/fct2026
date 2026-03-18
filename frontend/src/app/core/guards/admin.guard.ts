import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const adminGuard: CanActivateFn = () => {
  if (inject(AuthService).isAdmin()) return true;
  return inject(Router).createUrlTree(['/legal/terms']);
};

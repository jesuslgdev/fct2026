import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthRepository } from '@domain/repositories/auth.repository';

export const authGuard: CanActivateFn = async () => {
  const authRepository = inject(AuthRepository);
  const router = inject(Router);

  const user = await authRepository.getCurrentUser();

  if (user) return true;

  return router.createUrlTree(['/auth/login']);
};

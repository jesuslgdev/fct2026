import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { UserRole } from '@domain/enums/user-role.enum';

export function isAdminRole(role: string | null | undefined): boolean {
  if (!role) return false;
  const normalized = role.toLowerCase();
  return (
    normalized === UserRole.Admin ||
    normalized === UserRole.Administrator ||
    normalized.startsWith('admin')
  );
}

export const adminGuard: CanActivateFn = () => {
  const user = inject(AuthService).user();
  if (isAdminRole(user?.role)) return true;
  return inject(Router).createUrlTree(['/dashboard']);
};

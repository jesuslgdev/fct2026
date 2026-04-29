import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SALES_ACCESS_PERMISSIONS } from '@core/permissions/sales-access.policy';
import { AuthService } from '@core/services/auth.service';

export const salesDepartmentGuard: CanActivateFn = () => {
  if (inject(AuthService).hasPermission(SALES_ACCESS_PERMISSIONS)) {
    return true;
  }

  return inject(Router).createUrlTree(['/unauthorized']);
};

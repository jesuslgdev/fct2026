import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { UserPermission } from '@domain/enums/user-permission.enum';

export const salesDepartmentGuard: CanActivateFn = () => {
  if (
    inject(AuthService).hasPermission([
      UserPermission.Admin,
      UserPermission.SalesManager,
      UserPermission.SalesDepartment,
    ])
  ) {
    return true;
  }

  return inject(Router).createUrlTree(['/unauthorized']);
};

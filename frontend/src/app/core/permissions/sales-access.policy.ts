import { UserPermission } from '@domain/enums/user-permission.enum';

export const SALES_ACCESS_PERMISSIONS: readonly UserPermission[] = [
  UserPermission.Admin,
  UserPermission.SalesManager,
  UserPermission.SalesDepartment,
];

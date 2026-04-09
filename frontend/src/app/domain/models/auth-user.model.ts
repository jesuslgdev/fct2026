import { UserRole } from '@domain/enums/user-role.enum';
import { UserPermission } from '@domain/enums/user-permission.enum';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: UserRole | null;
  departmentId?: number | null;
  permissions?: UserPermission[];
}

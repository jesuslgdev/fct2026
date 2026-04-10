import { UserRole } from '@domain/enums/user-role.enum';

export interface User {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string | null;
  role: UserRole;
  departmentId: number | null;
  active: boolean;
  lastLoginAt?: string | null;
}

export interface ActivateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  departmentId: number | null;
}

export interface UpdateUserPayload {
  firstName?: string | null;
  lastName?: string | null;
  role?: UserRole | null;
  departmentId?: number | null;
}

export interface UserQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  role?: UserRole;
  active?: boolean;
}

export function isDepartmentRequiredForRole(role: UserRole | null): boolean {
  return role === UserRole.Employee || role === UserRole.Manager;
}

export type { PagedResult } from '@domain/models/paged-result.model';

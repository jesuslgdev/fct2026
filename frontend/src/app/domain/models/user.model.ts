import { UserRole } from '@domain/enums/user-role.enum';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  departmentId: string;
  departmentName: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  departmentId: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  departmentId?: string;
}

export interface UserQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  role?: UserRole;
  active?: boolean;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

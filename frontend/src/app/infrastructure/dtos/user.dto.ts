import { UserRole } from '@domain/enums/user-role.enum';

export interface UserDto {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  department_id: number | null;
  is_active: boolean;
}

export interface CreateUserDto {
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  department_id: number | null;
}

export interface UpdateUserDto {
  first_name?: string | null;
  last_name?: string | null;
  role?: UserRole | null;
  department_id?: number | null;
}

export interface SetUserActiveDto {
  is_active: boolean;
}

export interface UsersPageDto {
  items: UserDto[];
  total: number;
  page: number;
  page_size: number;
}

export interface DepartmentDto {
  department_id: number;
  name: string;
}

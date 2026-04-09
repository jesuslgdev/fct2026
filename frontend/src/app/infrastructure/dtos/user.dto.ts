import { UserRole } from '@domain/enums/user-role.enum';

export interface UserDto {
  user_id: number;
  first_name: string;
  last_name: string | null;
  email: string | null;
  role: UserRole;
  department_id: number | null;
  is_active: boolean;
  last_login_at: string | null;
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

export interface ActivateUserDto {
  first_name: string;
  last_name: string;
  email: string;
}

export interface UsersPageDto {
  items: UserDto[];
  total: number;
  page: number;
  page_size: number;
}

import { UserRole } from '@domain/enums/user-role.enum';

export interface UserDto {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  department_id: string;
  department_name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserDto {
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  department_id: string;
}

export interface UpdateUserDto {
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  department_id?: string;
}

export interface UsersPageDto {
  data: UserDto[];
  total: number;
  page: number;
  page_size: number;
}

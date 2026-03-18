export interface UserDto {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department_id: number | null;
  is_active: boolean;
}

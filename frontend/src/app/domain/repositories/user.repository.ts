import {
  User,
  Department,
  CreateUserPayload,
  UpdateUserPayload,
  UserQueryParams,
  PagedResult,
} from '@domain/models/user.model';

export abstract class UserRepository {
  abstract getUsers(params: UserQueryParams): Promise<PagedResult<User>>;
  abstract getUserById(id: string): Promise<User>;
  abstract createUser(payload: CreateUserPayload): Promise<User>;
  abstract updateUser(id: string, payload: UpdateUserPayload): Promise<User>;
  abstract toggleUserStatus(id: string, active: boolean): Promise<User>;
  abstract getDepartments(): Promise<Department[]>;
}

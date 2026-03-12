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
  abstract getUserById(id: number): Promise<User>;
  abstract createUser(payload: CreateUserPayload): Promise<User>;
  abstract updateUser(id: number, payload: UpdateUserPayload): Promise<User>;
  abstract toggleUserStatus(id: number, active: boolean): Promise<void>;
  abstract getDepartments(): Promise<Department[]>;
}

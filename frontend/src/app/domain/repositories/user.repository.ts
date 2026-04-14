import {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  UserQueryParams,
  PagedResult,
} from '@domain/models/user.model';
import { Department } from '@domain/models/department.model';
import { Observable } from 'rxjs';

export abstract class UserRepository {
  abstract getUsers(params: UserQueryParams): Observable<PagedResult<User>>;
  abstract getUserById(id: number): Observable<User>;
  abstract createUser(payload: CreateUserPayload): Observable<User>;
  abstract updateUser(id: number, payload: UpdateUserPayload): Observable<User>;
  abstract deactivateUser(id: number): Observable<void>;
  abstract activateUser(id: number): Observable<void>;
  abstract deleteUser(id: number): Observable<void>;
  abstract getDepartments(): Observable<Department[]>;
}

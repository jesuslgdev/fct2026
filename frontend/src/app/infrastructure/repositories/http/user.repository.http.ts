import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { UserRepository } from '@domain/repositories/user.repository';
import {
  UserAlreadyExistsError,
  UserAlreadyActiveError,
  UserApiError,
  UserDeletedError,
  UserForbiddenError,
  UserAlreadyInactiveError,
  UserNotFoundError,
  UserUnauthorizedError,
  UserValidationError,
} from '@domain/models/user-errors';
import {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  UserQueryParams,
  PagedResult,
} from '@domain/models/user.model';
import { Department } from '@domain/models/department.model';
import { UserDto, UsersPageDto } from '@infrastructure/dtos/user.dto';
import { DepartmentDto } from '@infrastructure/dtos/department.dto';
import { UserMapper } from '@infrastructure/mappers/user.mapper';
import { environment } from 'environments/environment';

const BASE_URL = `${environment.apiUrl}/api/v1/admin/users`;
const DEPARTMENTS_URL = `${environment.apiUrl}/api/v1/admin/departments`;

@Injectable()
export class HttpUserRepository implements UserRepository {
  private readonly http = inject(HttpClient);

  private withErrorMapping<T>(operation: () => Observable<T>): Observable<T> {
    return operation().pipe(
      catchError((err) => throwError(() => this.mapHttpError(err))),
    );
  }

  private mapHttpError(err: unknown): Error {
    if (!(err instanceof HttpErrorResponse)) {
      return err instanceof Error ? err : new UserApiError();
    }

    const message = this.extractErrorMessage(err);
    const code = this.extractErrorCode(err);

    switch (err.status) {
      case 400:
        return new UserValidationError(err.error, message ?? 'Validation failed.');
      case 401:
        return new UserUnauthorizedError(message ?? 'Authentication required.');
      case 403:
        return new UserForbiddenError(message ?? 'Insufficient permissions.');
      case 404:
        return new UserNotFoundError(message ?? 'User not found.');
      case 409:
        if (code === 1202) {
          return new UserAlreadyExistsError(message);
        }
        if (code === 1206) {
          return new UserAlreadyActiveError(message);
        }
        if (code === 1207) {
          return new UserAlreadyInactiveError(message);
        }
        if (code === 1208) {
          return new UserDeletedError(message);
        }
        return new UserApiError(message ?? 'Users operation conflict.');
      case 422:
        return new UserValidationError(err.error, message ?? 'Validation failed.');
      default:
        return new UserApiError(message ?? 'Unexpected users API error.');
    }
  }

  private extractErrorCode(err: HttpErrorResponse): number | undefined {
    if (!err.error || typeof err.error !== 'object') {
      return undefined;
    }

    const payload = err.error as Record<string, unknown>;
    const raw = payload['error_code'];
    return typeof raw === 'number' ? raw : undefined;
  }

  private extractErrorMessage(err: HttpErrorResponse): string | undefined {
    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }

    if (err.error && typeof err.error === 'object') {
      const payload = err.error as Record<string, unknown>;
      const rawMessage = payload['message'];
      const rawDetail = payload['detail'];

      if (typeof rawMessage === 'string' && rawMessage.trim()) {
        return rawMessage;
      }

      if (typeof rawDetail === 'string' && rawDetail.trim()) {
        return rawDetail;
      }
    }

    return undefined;
  }

  getUsers(params: UserQueryParams): Observable<PagedResult<User>> {
    return this.withErrorMapping(() => {
      const query: Record<string, string | number | boolean> = {
        page: params.page,
        page_size: params.pageSize,
      };

      if (params.search !== undefined) query['search'] = params.search;
      if (params.role !== undefined) query['role'] = params.role;
      if (params.active !== undefined) query['active'] = params.active;

      return this.http.get<UsersPageDto>(BASE_URL, { params: query }).pipe(
        map((response) => ({
          data: response.items.map(UserMapper.fromDto),
          total: response.total,
          page: response.page,
          pageSize: response.page_size,
        })),
      );
    });
  }

  getUserById(id: number): Observable<User> {
    return this.withErrorMapping(() =>
      this.http.get<UserDto>(`${BASE_URL}/${id}`).pipe(
        map((dto) => UserMapper.fromDto(dto)),
      ),
    );
  }

  createUser(payload: CreateUserPayload): Observable<User> {
    return this.withErrorMapping(() =>
      this.http.post<UserDto>(BASE_URL, UserMapper.toCreateDto(payload)).pipe(
        map((dto) => UserMapper.fromDto(dto)),
      ),
    );
  }

  updateUser(id: number, payload: UpdateUserPayload): Observable<User> {
    // Uses PUT to update the user. This is the current backend contract and
    // matches the OpenAPI spec (PUT /api/v1/admin/users/{user_id}).
    //
    // If the backend is later changed to support PATCH for partial updates,
    // use `updateUserPartial()` instead.
    return this.withErrorMapping(() =>
      this.http.put<UserDto>(`${BASE_URL}/${id}`, UserMapper.toUpdateDto(payload)).pipe(
        map((dto) => UserMapper.fromDto(dto)),
      ),
    );
  }

  updateUserPartial(id: number, payload: UpdateUserPayload): Observable<User> {
    // Prepared for a future endpoint that supports partial updates.
    // This sends only the fields present in `payload` using PATCH.
    return this.withErrorMapping(() =>
      this.http.patch<UserDto>(`${BASE_URL}/${id}`, UserMapper.toUpdateDto(payload)).pipe(
        map((dto) => UserMapper.fromDto(dto)),
      ),
    );
  }

  deactivateUser(id: number): Observable<void> {
    return this.withErrorMapping(() =>
      this.http.patch<void>(`${BASE_URL}/${id}/deactivate`, null),
    );
  }

  activateUser(id: number): Observable<void> {
    return this.withErrorMapping(() =>
      this.http.patch<void>(`${BASE_URL}/${id}/activate`, null),
    );
  }

  getDepartments(): Observable<Department[]> {
    return this.withErrorMapping(() =>
      this.http.get<DepartmentDto[]>(DEPARTMENTS_URL).pipe(
        map((dtos) => dtos.map(UserMapper.departmentFromDto)),
      ),
    );
  }
}

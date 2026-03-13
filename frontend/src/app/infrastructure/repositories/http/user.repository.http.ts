import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { UserRepository } from '@domain/repositories/user.repository';
import {
  UserApiError,
  UserForbiddenError,
  UserNotFoundError,
  UserUnauthorizedError,
  UserValidationError,
} from '@domain/models/user-errors';
import {
  User,
  Department,
  CreateUserPayload,
  UpdateUserPayload,
  UserQueryParams,
  PagedResult,
} from '@domain/models/user.model';
import {
  UserDto,
  UsersPageDto,
  SetUserActiveDto,
  DepartmentDto,
} from '@infrastructure/dtos/user.dto';
import { UserMapper } from '@infrastructure/mappers/user.mapper';
import { environment } from 'environments/environment';

const BASE_URL = `${environment.apiUrl}/api/v1/admin/users`;
const DEPARTMENTS_URL = `${environment.apiUrl}/api/v1/admin/departments`;

@Injectable()
export class HttpUserRepository implements UserRepository {
  private readonly http = inject(HttpClient);

  private async withErrorMapping<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (err) {
      throw this.mapHttpError(err);
    }
  }

  private mapHttpError(err: unknown): Error {
    if (!(err instanceof HttpErrorResponse)) {
      return err instanceof Error ? err : new UserApiError();
    }

    const message = this.extractErrorMessage(err);

    switch (err.status) {
      case 400:
      case 422:
        return new UserValidationError(err.error, message ?? 'Validation failed.');
      case 401:
        return new UserUnauthorizedError(message ?? 'Authentication required.');
      case 403:
        return new UserForbiddenError(message ?? 'Insufficient permissions.');
      case 404:
        return new UserNotFoundError(message ?? 'User not found.');
      default:
        return new UserApiError(message ?? 'Unexpected users API error.');
    }
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

  async getUsers(params: UserQueryParams): Promise<PagedResult<User>> {
    return this.withErrorMapping(async () => {
      const query: Record<string, string | number | boolean> = {
        page: params.page,
        page_size: params.pageSize,
      };

      if (params.search !== undefined) query['search'] = params.search;
      if (params.role !== undefined) query['role'] = params.role;
      if (params.active !== undefined) query['active'] = params.active;

      const response = await firstValueFrom(
        this.http.get<UsersPageDto>(BASE_URL, { params: query }),
      );

      return {
        data: response.items.map(UserMapper.fromDto),
        total: response.total,
        page: response.page,
        pageSize: response.page_size,
      };
    });
  }

  async getUserById(id: number): Promise<User> {
    return this.withErrorMapping(async () => {
      const dto = await firstValueFrom(this.http.get<UserDto>(`${BASE_URL}/${id}`));
      return UserMapper.fromDto(dto);
    });
  }

  async createUser(payload: CreateUserPayload): Promise<User> {
    return this.withErrorMapping(async () => {
      const dto = await firstValueFrom(
        this.http.post<UserDto>(BASE_URL, UserMapper.toCreateDto(payload)),
      );
      return UserMapper.fromDto(dto);
    });
  }

  async updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
    return this.withErrorMapping(async () => {
      const dto = await firstValueFrom(
        this.http.put<UserDto>(`${BASE_URL}/${id}`, UserMapper.toUpdateDto(payload)),
      );
      return UserMapper.fromDto(dto);
    });
  }

  async toggleUserStatus(id: number, active: boolean): Promise<void> {
    return this.withErrorMapping(async () => {
      const body: SetUserActiveDto = { is_active: active };
      await firstValueFrom(this.http.patch<void>(`${BASE_URL}/${id}/active`, body));
    });
  }

  async getDepartments(): Promise<Department[]> {
    return this.withErrorMapping(async () => {
      const dtos = await firstValueFrom(
        this.http.get<DepartmentDto[]>(DEPARTMENTS_URL),
      );
      return dtos.map(UserMapper.departmentFromDto);
    });
  }
}

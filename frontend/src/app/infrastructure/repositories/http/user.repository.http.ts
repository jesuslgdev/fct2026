import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { UserRepository } from '@domain/repositories/user.repository';
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

const BASE_URL = '/api/v1/admin/users';
const DEPARTMENTS_URL = '/api/v1/admin/departments';

@Injectable()
export class HttpUserRepository implements UserRepository {
  private readonly http = inject(HttpClient);

  async getUsers(params: UserQueryParams): Promise<PagedResult<User>> {
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
  }

  async getUserById(id: number): Promise<User> {
    const dto = await firstValueFrom(this.http.get<UserDto>(`${BASE_URL}/${id}`));
    return UserMapper.fromDto(dto);
  }

  async createUser(payload: CreateUserPayload): Promise<User> {
    const dto = await firstValueFrom(
      this.http.post<UserDto>(BASE_URL, UserMapper.toCreateDto(payload)),
    );
    return UserMapper.fromDto(dto);
  }

  async updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
    const dto = await firstValueFrom(
      this.http.put<UserDto>(`${BASE_URL}/${id}`, UserMapper.toUpdateDto(payload)),
    );
    return UserMapper.fromDto(dto);
  }

  async toggleUserStatus(id: number, active: boolean): Promise<void> {
    const body: SetUserActiveDto = { is_active: active };
    await firstValueFrom(this.http.patch<void>(`${BASE_URL}/${id}/active`, body));
  }

  async getDepartments(): Promise<Department[]> {
    const dtos = await firstValueFrom(
      this.http.get<DepartmentDto[]>(DEPARTMENTS_URL),
    );
    return dtos.map(UserMapper.departmentFromDto);
  }
}

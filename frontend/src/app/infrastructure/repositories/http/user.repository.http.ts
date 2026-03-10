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
import { UserDto, UsersPageDto } from '@infrastructure/dtos/user.dto';
import { UserMapper } from '@infrastructure/mappers/user.mapper';

// TODO add base url for API REST
const BASE_URL = '/api/users';

@Injectable()
export class HttpUserRepository implements UserRepository {
  private readonly http = inject(HttpClient);

  async getUsers(params: UserQueryParams): Promise<PagedResult<User>> {
    // TODO: GET ${BASE_URL}?page=&pageSize=&search=&role=&active=
    const response = await firstValueFrom(
      this.http.get<UsersPageDto>(BASE_URL, { params: { ...params } as Record<string, string | number | boolean> }),
    );
    return {
      data: response.data.map(UserMapper.fromDto),
      total: response.total,
      page: response.page,
      pageSize: response.page_size,
    };
  }

  async getUserById(id: string): Promise<User> {
    // TODO: GET ${BASE_URL}/:id
    const dto = await firstValueFrom(this.http.get<UserDto>(`${BASE_URL}/${id}`));
    return UserMapper.fromDto(dto);
  }

  async createUser(payload: CreateUserPayload): Promise<User> {
    // TODO: POST ${BASE_URL}
    const dto = await firstValueFrom(
      this.http.post<UserDto>(BASE_URL, UserMapper.toCreateDto(payload)),
    );
    return UserMapper.fromDto(dto);
  }

  async updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
    // TODO: PATCH ${BASE_URL}/:id
    const dto = await firstValueFrom(
      this.http.patch<UserDto>(`${BASE_URL}/${id}`, UserMapper.toUpdateDto(payload)),
    );
    return UserMapper.fromDto(dto);
  }

  async toggleUserStatus(id: string, active: boolean): Promise<User> {
    // TODO: PATCH ${BASE_URL}/:id/status
    const dto = await firstValueFrom(
      this.http.patch<UserDto>(`${BASE_URL}/${id}/status`, { active }),
    );
    return UserMapper.fromDto(dto);
  }

  async getDepartments(): Promise<Department[]> {
    // TODO: GET /api/departments (consumir endpoint de la feature Departments cuando esté disponible)
    return [];
  }
}

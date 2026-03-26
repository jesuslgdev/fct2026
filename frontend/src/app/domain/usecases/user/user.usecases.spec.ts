import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { UserRepository } from '@domain/repositories/user.repository';
import {
  User,
  Department,
  CreateUserPayload,
  UpdateUserPayload,
  UserQueryParams,
  PagedResult,
} from '@domain/models/user.model';
import { UserRole } from '@domain/enums/user-role.enum';
import { GetUsersUseCase } from '@domain/usecases/user/get-users.usecase';
import { GetUserByIdUseCase } from '@domain/usecases/user/get-user-by-id.usecase';
import { CreateUserUseCase } from '@domain/usecases/user/create-user.usecase';
import { UpdateUserUseCase } from '@domain/usecases/user/update-user.usecase';
import { ToggleUserStatusUseCase } from '@domain/usecases/user/toggle-user-status.usecase';

const USER_MOCK: User = {
  id: 1,
  firstName: 'Ana',
  lastName: 'Garcia',
  email: 'ana@example.com',
  role: UserRole.Administrator,
  departmentId: 1,
  active: true,
};

class MockUserRepository implements UserRepository {
  getUsers = vi.fn<
    (params: UserQueryParams) => Promise<PagedResult<User>>
  >();
  getUserById = vi.fn<(id: number) => Promise<User>>();
  createUser = vi.fn<(payload: CreateUserPayload) => Promise<User>>();
  updateUser = vi.fn<(id: number, payload: UpdateUserPayload) => Promise<User>>();
  toggleUserStatus = vi.fn<(id: number, active: boolean) => Promise<void>>();
  getDepartments = vi.fn<() => Promise<Department[]>>();
}

describe('User Use Cases', () => {
  let repo: MockUserRepository;

  beforeEach(() => {
    repo = new MockUserRepository();
    TestBed.configureTestingModule({
      providers: [
        GetUsersUseCase,
        GetUserByIdUseCase,
        CreateUserUseCase,
        UpdateUserUseCase,
        ToggleUserStatusUseCase,
        { provide: UserRepository, useValue: repo },
      ],
    });
  });

  it('GetUsersUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetUsersUseCase);
    const params: UserQueryParams = { page: 1, pageSize: 20 };
    const resultMock: PagedResult<User> = {
      data: [USER_MOCK],
      total: 1,
      page: 1,
      pageSize: 20,
    };
    repo.getUsers.mockResolvedValueOnce(resultMock);

    const result = await useCase.execute(params);

    expect(repo.getUsers).toHaveBeenCalledOnce();
    expect(repo.getUsers).toHaveBeenCalledWith(params);
    expect(result).toEqual(resultMock);
  });

  it('GetUserByIdUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetUserByIdUseCase);
    repo.getUserById.mockResolvedValueOnce(USER_MOCK);

    const result = await useCase.execute(1);

    expect(repo.getUserById).toHaveBeenCalledWith(1);
    expect(result).toEqual(USER_MOCK);
  });

  it('CreateUserUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(CreateUserUseCase);
    const payload: CreateUserPayload = {
      firstName: 'Ana',
      lastName: 'Garcia',
      email: 'ana@example.com',
      role: UserRole.Administrator,
      departmentId: 1,
    };
    repo.createUser.mockResolvedValueOnce(USER_MOCK);

    const result = await useCase.execute(payload);

    expect(repo.createUser).toHaveBeenCalledWith(payload);
    expect(result).toEqual(USER_MOCK);
  });

  it('UpdateUserUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(UpdateUserUseCase);
    const payload: UpdateUserPayload = { firstName: 'Ana Maria' };
    const updated: User = { ...USER_MOCK, firstName: 'Ana Maria' };
    repo.updateUser.mockResolvedValueOnce(updated);

    const result = await useCase.execute(1, payload);

    expect(repo.updateUser).toHaveBeenCalledWith(1, payload);
    expect(result).toEqual(updated);
  });

  it('ToggleUserStatusUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(ToggleUserStatusUseCase);
    repo.toggleUserStatus.mockResolvedValueOnce();

    await useCase.execute(1, false);

    expect(repo.toggleUserStatus).toHaveBeenCalledWith(1, false);
    expect(repo.toggleUserStatus).toHaveBeenCalledOnce();
  });
});

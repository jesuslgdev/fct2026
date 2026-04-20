import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { UserRepository } from '@domain/repositories/user.repository';
import { firstValueFrom, Observable, of } from 'rxjs';
import {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  UserQueryParams,
  PagedResult,
} from '@domain/models/user.model';
import { Department } from '@domain/models/department.model';
import { UserRole } from '@domain/enums/user-role.enum';
import { GetUsersUseCase } from '@domain/usecases/user/get-users.usecase';
import { GetUserByIdUseCase } from '@domain/usecases/user/get-user-by-id.usecase';
import { CreateUserUseCase } from '@domain/usecases/user/create-user.usecase';
import { UpdateUserUseCase } from '@domain/usecases/user/update-user.usecase';
import { ActivateUserUseCase } from '@domain/usecases/user/activate-user.usecase';
import { DeactivateUserUseCase } from '@domain/usecases/user/deactivate-user.usecase';
import { DeleteUserUseCase } from '@domain/usecases/user/delete-user.usecase';
import { UserValidationError } from '@domain/models/user-errors';

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
    (params: UserQueryParams) => Observable<PagedResult<User>>
  >();
  getUserById = vi.fn<(id: number) => Observable<User>>();
  createUser = vi.fn<(payload: CreateUserPayload) => Observable<User>>();
  updateUser = vi.fn<(id: number, payload: UpdateUserPayload) => Observable<User>>();
  deactivateUser = vi.fn<(id: number) => Observable<void>>();
  activateUser = vi.fn<(id: number) => Observable<void>>();
  deleteUser = vi.fn<(id: number) => Observable<void>>();
  getDepartments = vi.fn<() => Observable<Department[]>>();
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
        ActivateUserUseCase,
        DeactivateUserUseCase,
        DeleteUserUseCase,
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
    repo.getUsers.mockReturnValueOnce(of(resultMock));

    const result = await firstValueFrom(useCase.execute(params));

    expect(repo.getUsers).toHaveBeenCalledOnce();
    expect(repo.getUsers).toHaveBeenCalledWith(params);
    expect(result).toEqual(resultMock);
  });

  it('GetUsersUseCase normalizes search before delegating', async () => {
    const useCase = TestBed.inject(GetUsersUseCase);
    const resultMock: PagedResult<User> = {
      data: [USER_MOCK],
      total: 1,
      page: 1,
      pageSize: 20,
    };
    repo.getUsers.mockReturnValueOnce(of(resultMock));

    await firstValueFrom(useCase.execute({ page: 1, pageSize: 20, search: '  ana  ' }));

    expect(repo.getUsers).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      search: 'ana',
    });
  });

  it('GetUsersUseCase rejects invalid pagination', async () => {
    const useCase = TestBed.inject(GetUsersUseCase);

    await expect(
      firstValueFrom(useCase.execute({ page: 0, pageSize: 20 })),
    ).rejects.toBeInstanceOf(UserValidationError);

    expect(repo.getUsers).not.toHaveBeenCalled();
  });

  it('GetUserByIdUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetUserByIdUseCase);
    repo.getUserById.mockReturnValueOnce(of(USER_MOCK));

    const result = await firstValueFrom(useCase.execute(1));

    expect(repo.getUserById).toHaveBeenCalledWith(1);
    expect(result).toEqual(USER_MOCK);
  });

  it('GetUserByIdUseCase rejects invalid ids', async () => {
    const useCase = TestBed.inject(GetUserByIdUseCase);

    await expect(firstValueFrom(useCase.execute(0))).rejects.toBeInstanceOf(
      UserValidationError,
    );

    expect(repo.getUserById).not.toHaveBeenCalled();
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
    repo.createUser.mockReturnValueOnce(of(USER_MOCK));

    const result = await firstValueFrom(useCase.execute(payload));

    expect(repo.createUser).toHaveBeenCalledWith(payload);
    expect(result).toEqual(USER_MOCK);
  });

  it('CreateUserUseCase normalizes payload before delegating', async () => {
    const useCase = TestBed.inject(CreateUserUseCase);
    repo.createUser.mockReturnValueOnce(of(USER_MOCK));

    await firstValueFrom(
      useCase.execute({
        firstName: '  Ana  ',
        lastName: '  Garcia  ',
        email: '  ana@example.com  ',
        role: UserRole.Administrator,
        departmentId: null,
      }),
    );

    expect(repo.createUser).toHaveBeenCalledWith({
      firstName: 'Ana',
      lastName: 'Garcia',
      email: 'ana@example.com',
      role: UserRole.Administrator,
      departmentId: null,
    });
  });

  it('CreateUserUseCase rejects missing department for employees', async () => {
    const useCase = TestBed.inject(CreateUserUseCase);

    await expect(
      firstValueFrom(
        useCase.execute({
          firstName: 'Ana',
          lastName: 'Garcia',
          email: 'ana@example.com',
          role: UserRole.Employee,
          departmentId: null,
        }),
      ),
    ).rejects.toBeInstanceOf(UserValidationError);

    expect(repo.createUser).not.toHaveBeenCalled();
  });

  it('CreateUserUseCase rejects invalid email', async () => {
    const useCase = TestBed.inject(CreateUserUseCase);

    await expect(
      firstValueFrom(
        useCase.execute({
          firstName: 'Ana',
          lastName: 'Garcia',
          email: 'not-an-email',
          role: UserRole.Administrator,
          departmentId: null,
        }),
      ),
    ).rejects.toBeInstanceOf(UserValidationError);

    expect(repo.createUser).not.toHaveBeenCalled();
  });

  it('UpdateUserUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(UpdateUserUseCase);
    const payload: UpdateUserPayload = { firstName: 'Ana Maria' };
    const updated: User = { ...USER_MOCK, firstName: 'Ana Maria' };
    repo.updateUser.mockReturnValueOnce(of(updated));

    const result = await firstValueFrom(useCase.execute(1, payload));

    expect(repo.updateUser).toHaveBeenCalledWith(1, payload);
    expect(result).toEqual(updated);
  });

  it('UpdateUserUseCase normalizes payload before delegating', async () => {
    const useCase = TestBed.inject(UpdateUserUseCase);
    const updated: User = { ...USER_MOCK, firstName: 'Ana Maria' };
    repo.updateUser.mockReturnValueOnce(of(updated));

    await firstValueFrom(useCase.execute(1, { firstName: '  Ana Maria  ' }));

    expect(repo.updateUser).toHaveBeenCalledWith(1, { firstName: 'Ana Maria' });
  });

  it('UpdateUserUseCase rejects invalid ids', async () => {
    const useCase = TestBed.inject(UpdateUserUseCase);

    await expect(firstValueFrom(useCase.execute(0, { firstName: 'Ana' }))).rejects.toBeInstanceOf(
      UserValidationError,
    );

    expect(repo.updateUser).not.toHaveBeenCalled();
  });

  it('UpdateUserUseCase rejects missing department when changing to manager', async () => {
    const useCase = TestBed.inject(UpdateUserUseCase);

    await expect(
      firstValueFrom(
        useCase.execute(1, {
          role: UserRole.Manager,
          departmentId: null,
        }),
      ),
    ).rejects.toBeInstanceOf(UserValidationError);

    expect(repo.updateUser).not.toHaveBeenCalled();
  });

  it('DeactivateUserUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(DeactivateUserUseCase);
    repo.deactivateUser.mockReturnValueOnce(of(void 0));

    await firstValueFrom(useCase.execute(1));

    expect(repo.deactivateUser).toHaveBeenCalledWith(1);
    expect(repo.deactivateUser).toHaveBeenCalledOnce();
  });

  it('DeactivateUserUseCase rejects invalid ids', async () => {
    const useCase = TestBed.inject(DeactivateUserUseCase);

    await expect(firstValueFrom(useCase.execute(0))).rejects.toBeInstanceOf(
      UserValidationError,
    );

    expect(repo.deactivateUser).not.toHaveBeenCalled();
  });

  it('ActivateUserUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(ActivateUserUseCase);
    repo.activateUser.mockReturnValueOnce(of(void 0));

    await firstValueFrom(useCase.execute(1));

    expect(repo.activateUser).toHaveBeenCalledWith(1);
    expect(repo.activateUser).toHaveBeenCalledOnce();
  });

  it('ActivateUserUseCase rejects invalid ids', async () => {
    const useCase = TestBed.inject(ActivateUserUseCase);

    await expect(firstValueFrom(useCase.execute(0))).rejects.toBeInstanceOf(
      UserValidationError,
    );

    expect(repo.activateUser).not.toHaveBeenCalled();
  });

  it('DeleteUserUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(DeleteUserUseCase);
    repo.deleteUser.mockReturnValueOnce(of(void 0));

    await firstValueFrom(useCase.execute(1));

    expect(repo.deleteUser).toHaveBeenCalledWith(1);
    expect(repo.deleteUser).toHaveBeenCalledOnce();
  });

  it('DeleteUserUseCase rejects invalid ids', async () => {
    const useCase = TestBed.inject(DeleteUserUseCase);

    await expect(firstValueFrom(useCase.execute(0))).rejects.toBeInstanceOf(
      UserValidationError,
    );

    expect(repo.deleteUser).not.toHaveBeenCalled();
  });
});

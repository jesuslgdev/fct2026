import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { UsersStore } from '@features/users/state/users.store';
import { AuthService } from '@core/services/auth.service';
import { UserRepository } from '@domain/repositories/user.repository';
import {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  UserQueryParams,
  PagedResult,
} from '@domain/models/user.model';
import { Department } from '@domain/models/department.model';
import { UserRole } from '@domain/enums/user-role.enum';
import {
  UserForbiddenError,
  UserValidationError,
} from '@domain/models/user-errors';

const USER_A: User = {
  id: 1,
  firstName: 'Ana',
  lastName: 'Garcia',
  email: 'ana@example.com',
  role: UserRole.Administrator,
  departmentId: 1,
  active: true,
};

const USER_B: User = {
  id: 2,
  firstName: 'Carlos',
  lastName: 'Martinez',
  email: 'carlos@example.com',
  role: UserRole.Manager,
  departmentId: 2,
  active: true,
};

class MockAuthService {
  readonly user = signal({
    uid: 'uid-1',
    email: 'admin@example.com',
    displayName: 'Admin',
    photoURL: null,
    role: UserRole.Administrator as const,
  });
  readonly isAdmin = signal(true);
}

class MockUserRepository implements UserRepository {
  getUsers = vi.fn<(params: UserQueryParams) => Observable<PagedResult<User>>>();
  getUserById = vi.fn<(id: number) => Observable<User>>();
  createUser = vi.fn<(payload: CreateUserPayload) => Observable<User>>();
  updateUser = vi.fn<(id: number, payload: UpdateUserPayload) => Observable<User>>();
  deactivateUser = vi.fn<(id: number) => Observable<void>>();
  activateUser = vi.fn<(id: number) => Observable<void>>();
  deleteUser = vi.fn<(id: number) => Observable<void>>();
  getDepartments = vi.fn<() => Observable<Department[]>>();
}

describe('UsersStore', () => {
  let store: UsersStore;
  let repo: MockUserRepository;

  beforeEach(() => {
    repo = new MockUserRepository();

    TestBed.configureTestingModule({
      providers: [
        UsersStore,
        { provide: AuthService, useValue: new MockAuthService() },
        { provide: UserRepository, useValue: repo },
      ],
    });

    store = TestBed.inject(UsersStore);
  });

  it('loads users and total successfully', async () => {
    const response: PagedResult<User> = {
      data: [USER_A, USER_B],
      total: 2,
      page: 1,
      pageSize: 20,
    };
    repo.getUsers.mockReturnValueOnce(of(response));

    await store.loadUsers();

    expect(repo.getUsers).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      search: undefined,
      role: undefined,
      active: undefined,
    });
    expect(store.users()).toEqual([USER_A, USER_B]);
    expect(store.total()).toBe(2);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('sets error when loading users fails', async () => {
    repo.getUsers.mockReturnValueOnce(throwError(() => new Error('boom')));

    await store.loadUsers();

    expect(store.error()).toBe('No se pudieron cargar los usuarios.');
    expect(store.loading()).toBe(false);
  });

  it('maps forbidden users error to a specific message', async () => {
    repo.getUsers.mockReturnValueOnce(throwError(() => new UserForbiddenError()));

    await store.loadUsers();

    expect(store.error()).toBe('No tienes permisos para realizar esta accion.');
  });

  it('maps validation users error to backend message', async () => {
    repo.createUser.mockReturnValueOnce(
      throwError(() => new UserValidationError({ field: 'email' }, 'Email already exists.')),
    );

    await store.saveUser({
      firstName: 'Ana',
      lastName: 'Garcia',
      email: 'ana@example.com',
      role: UserRole.Administrator,
      departmentId: 1,
    });

    expect(store.dialogError()).toBe('Email already exists.');
  });

  it('creates a new user and updates state', async () => {
    const payload: CreateUserPayload = {
      firstName: 'Carlos',
      lastName: 'Martinez',
      email: 'carlos@example.com',
      role: UserRole.Manager,
      departmentId: 2,
    };
    
    // Mock initial users load
    repo.getUsers.mockReturnValueOnce(of({ data: [USER_A], total: 1, page: 1, pageSize: 20 }));
    await store.loadUsers();
    
    repo.createUser.mockReturnValueOnce(of(USER_B));
    const refreshSpy = vi.spyOn(store, 'loadUsers').mockImplementation(() => undefined);
    
    store.openCreateDialog();
    await store.saveUser(payload);

    expect(repo.createUser).toHaveBeenCalledWith(payload);
    expect(refreshSpy).toHaveBeenCalledOnce();
    expect(store.dialogVisible()).toBe(false);
    expect(store.selectedUser()).toBeNull();
  });

  it('updates an existing user in edit mode', async () => {
    const updated: User = { ...USER_A, lastName: 'Gonzalez' };
    const payload: UpdateUserPayload = { lastName: 'Gonzalez' };
    
    repo.getUsers.mockReturnValueOnce(of({ data: [USER_A], total: 1, page: 1, pageSize: 20 }));
    await store.loadUsers();
    
    repo.updateUser.mockReturnValueOnce(of(updated));
    
    store.openEditDialog(USER_A);
    await store.saveUser(payload);

    expect(repo.updateUser).toHaveBeenCalledWith(USER_A.id, payload);
    expect(store.users()).toEqual([updated]);
    expect(store.dialogVisible()).toBe(false);
  });

  it('deactivates an active user and refreshes the list', async () => {
    repo.getUsers.mockReturnValueOnce(of({ data: [USER_A], total: 1, page: 1, pageSize: 20 }));
    await store.loadUsers();

    repo.deactivateUser.mockReturnValueOnce(of(void 0));
    const refreshSpy = vi.spyOn(store, 'loadUsers').mockImplementation(() => undefined);
    
    store.requestToggleStatus(USER_A);
    await store.confirmToggleStatus();

    expect(repo.deactivateUser).toHaveBeenCalledWith(USER_A.id);
    expect(refreshSpy).toHaveBeenCalledOnce();
    expect(store.confirmDialogVisible()).toBe(false);
    expect(store.userToToggle()).toBeNull();
  });

  it('opens status confirmation when requesting status change on inactive user', () => {
    const inactiveUser: User = {
      ...USER_A,
      id: 10,
      active: false,
      lastName: null,
      email: null,
    };

    store.requestToggleStatus(inactiveUser);

    expect(store.confirmDialogVisible()).toBe(true);
    expect(store.userToToggle()).toEqual(inactiveUser);
  });

  it('reactivates an inactive user and refreshes the list', async () => {
    const inactiveUser: User = {
      ...USER_A,
      id: 11,
      active: false,
      lastName: null,
      email: null,
    };

    store.requestToggleStatus(inactiveUser);
    repo.activateUser.mockReturnValueOnce(of(void 0));
    const refreshSpy = vi.spyOn(store, 'loadUsers').mockImplementation(() => undefined);

    await store.confirmToggleStatus();

    expect(repo.activateUser).toHaveBeenCalledWith(inactiveUser.id);
    expect(refreshSpy).toHaveBeenCalledOnce();
    expect(store.confirmDialogVisible()).toBe(false);
    expect(store.userToToggle()).toBeNull();
  });

  it('deletes a user and refreshes the list', async () => {
    store.requestDeleteUser(USER_A);
    repo.deleteUser.mockReturnValueOnce(of(void 0));
    const refreshSpy = vi.spyOn(store, 'loadUsers').mockImplementation(() => undefined);

    await store.confirmDeleteUser();

    expect(repo.deleteUser).toHaveBeenCalledWith(USER_A.id);
    expect(refreshSpy).toHaveBeenCalledOnce();
    expect(store.deleteDialogVisible()).toBe(false);
    expect(store.userToDelete()).toBeNull();
  });

  it('search resets page and triggers load', () => {
    const spy = vi.spyOn(store, 'loadUsers').mockImplementation(() => undefined);
    store.page.set(5);

    store.onSearch('ana');

    expect(store.searchQuery()).toBe('ana');
    expect(store.page()).toBe(1);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('page change updates pagination and triggers load', () => {
    const spy = vi.spyOn(store, 'loadUsers').mockImplementation(() => undefined);

    store.onPageChange({ first: 20, rows: 10 });

    expect(store.page()).toBe(3);
    expect(store.pageSize()).toBe(10);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('loads departments and stores result', async () => {
    const departments: Department[] = [
      { id: 1, name: 'Tecnologia' },
      { id: 2, name: 'Ventas' },
    ];
    repo.getDepartments.mockReturnValueOnce(of(departments));

    await store.loadDepartments();

    expect(repo.getDepartments).toHaveBeenCalledOnce();
    expect(store.departments()).toEqual(departments);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { UsersStore } from '@features/users/state/users.store';
import { AuthService } from '@core/services/auth.service';
import { UserRepository } from '@domain/repositories/user.repository';
import {
  User,
  Department,
  CreateUserPayload,
  UpdateUserPayload,
  UserQueryParams,
  PagedResult,
} from '@domain/models/user.model';

const USER_A: User = {
  id: 1,
  firstName: 'Ana',
  lastName: 'Garcia',
  email: 'ana@example.com',
  role: 'Administrator',
  departmentId: 1,
  active: true,
};

const USER_B: User = {
  id: 2,
  firstName: 'Carlos',
  lastName: 'Martinez',
  email: 'carlos@example.com',
  role: 'Manager',
  departmentId: 2,
  active: true,
};

class MockAuthService {
  readonly user = signal({
    uid: 'uid-1',
    email: 'admin@example.com',
    displayName: 'Admin',
    photoURL: null,
    role: 'Administrator' as const,
  });
}

class MockUserRepository implements UserRepository {
  getUsers = vi.fn<(params: UserQueryParams) => Promise<PagedResult<User>>>();
  getUserById = vi.fn<(id: number) => Promise<User>>();
  createUser = vi.fn<(payload: CreateUserPayload) => Promise<User>>();
  updateUser = vi.fn<(id: number, payload: UpdateUserPayload) => Promise<User>>();
  toggleUserStatus = vi.fn<(id: number, active: boolean) => Promise<void>>();
  getDepartments = vi.fn<() => Promise<Department[]>>();
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
    repo.getUsers.mockResolvedValueOnce(response);

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
    repo.getUsers.mockRejectedValueOnce(new Error('boom'));

    await store.loadUsers();

    expect(store.error()).toBe('Failed to load users.');
    expect(store.loading()).toBe(false);
  });

  it('creates a new user and updates state', async () => {
    const payload: CreateUserPayload = {
      firstName: 'Carlos',
      lastName: 'Martinez',
      email: 'carlos@example.com',
      role: 'Manager',
      departmentId: 2,
    };
    repo.createUser.mockResolvedValueOnce(USER_B);

    store.users.set([USER_A]);
    store.total.set(1);
    store.dialogVisible.set(true);

    await store.saveUser(payload);

    expect(repo.createUser).toHaveBeenCalledWith(payload);
    expect(store.users()).toEqual([USER_A, USER_B]);
    expect(store.total()).toBe(2);
    expect(store.dialogVisible()).toBe(false);
    expect(store.selectedUser()).toBeNull();
  });

  it('updates an existing user in edit mode', async () => {
    const updated: User = { ...USER_A, lastName: 'Gonzalez' };
    const payload: UpdateUserPayload = { lastName: 'Gonzalez' };
    repo.updateUser.mockResolvedValueOnce(updated);

    store.users.set([USER_A]);
    store.selectedUser.set(USER_A);
    store.dialogMode.set('edit');

    await store.saveUser(payload);

    expect(repo.updateUser).toHaveBeenCalledWith(USER_A.id, payload);
    expect(store.users()).toEqual([updated]);
    expect(store.dialogVisible()).toBe(false);
  });

  it('toggles status and closes confirm dialog', async () => {
    repo.toggleUserStatus.mockResolvedValueOnce();

    store.users.set([USER_A]);
    store.userToToggle.set(USER_A);
    store.confirmDialogVisible.set(true);

    await store.confirmToggleStatus();

    expect(repo.toggleUserStatus).toHaveBeenCalledWith(USER_A.id, false);
    expect(store.users()[0].active).toBe(false);
    expect(store.confirmDialogVisible()).toBe(false);
    expect(store.userToToggle()).toBeNull();
  });

  it('search resets page and triggers load', () => {
    const spy = vi.spyOn(store, 'loadUsers').mockResolvedValue();
    store.page.set(5);

    store.onSearch('ana');

    expect(store.searchQuery()).toBe('ana');
    expect(store.page()).toBe(1);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('loads departments and stores result', async () => {
    const departments: Department[] = [
      { id: 1, name: 'Tecnologia' },
      { id: 2, name: 'Ventas' },
    ];
    repo.getDepartments.mockResolvedValueOnce(departments);

    await store.loadDepartments();

    expect(repo.getDepartments).toHaveBeenCalledOnce();
    expect(store.departments()).toEqual(departments);
  });
});

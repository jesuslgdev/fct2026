import { Injectable } from '@angular/core';
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
import { Observable, of, throwError } from 'rxjs';

// Minimal departments needed for the user form selector.
// When the Departments feature is implemented, getDepartments() will
// consume that repository. For now they are kept here as support data.
const INITIAL_MOCK_DEPARTMENTS: Department[] = [
  { id: 1, name: 'Tecnologia' },
  { id: 2, name: 'Recursos Humanos' },
  { id: 3, name: 'Ventas' },
  { id: 4, name: 'Administracion' },
];

const INITIAL_MOCK_USERS: User[] = [
  {
    id: 1,
    firstName: 'Ana',
    lastName: 'Garcia',
    email: 'ana.garcia@empresa.com',
    role: UserRole.Administrator,
    departmentId: 4,
    active: true,
    lastLoginAt: '2026-03-15T09:00:00Z',
  },
  {
    id: 2,
    firstName: 'Carlos',
    lastName: 'Martinez',
    email: 'carlos.martinez@empresa.com',
    role: UserRole.Manager,
    departmentId: 1,
    active: true,
    lastLoginAt: '2026-03-15T09:00:00Z',
  },
  {
    id: 3,
    firstName: 'Laura',
    lastName: 'Sanchez',
    email: 'laura.sanchez@gmail.com',
    role: UserRole.Employee,
    departmentId: 2,
    active: true,
    lastLoginAt: '2026-03-15T09:00:00Z',
  },
  {
    id: 4,
    firstName: 'Pedro',
    lastName: 'Lopez',
    email: 'pedro.lopez@empresa.com',
    role: UserRole.Employee,
    departmentId: 3,
    active: true,
    lastLoginAt: '2026-03-15T09:00:00Z',
  },
  {
    id: 5,
    firstName: 'Maria',
    lastName: null,
    email: null,
    role: UserRole.Employee,
    departmentId: 3,
    active: false,
    lastLoginAt: null,
  },
  {
    id: 6,
    firstName: 'Javier',
    lastName: 'Ruiz',
    email: 'javier.ruiz@empresa.com',
    role: UserRole.Manager,
    departmentId: 2,
    active: true,
    lastLoginAt: '2026-03-15T09:00:00Z',
  },
  {
    id: 7,
    firstName: 'Sofia',
    lastName: 'Torres',
    email: 'sofia.torres@gmail.com',
    role: UserRole.Employee,
    departmentId: 1,
    active: true,
    lastLoginAt: '2026-03-15T09:00:00Z',
  },
  {
    id: 8,
    firstName: 'DELETED',
    lastName: 'DELETED',
    email: 'deleted_8@deleted.com',
    role: UserRole.Employee,
    departmentId: 1,
    active: false,
    lastLoginAt: '2026-03-20T09:00:00Z',
  },
];

@Injectable()
export class MockUserRepository implements UserRepository {
  private users: User[];

  constructor() {
    this.users = INITIAL_MOCK_USERS.map((u) => ({ ...u }));
  }

  private getUserByIdOrThrow(id: number): User | null {
    const user = this.users.find((u) => u.id === id);
    return user ?? null;
  }

  getUsers(params: UserQueryParams): Observable<PagedResult<User>> {
    let filtered = [...this.users];

    if (params.search) {
      const term = params.search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.firstName.toLowerCase().includes(term) ||
          (u.lastName ?? '').toLowerCase().includes(term) ||
          (u.email ?? '').toLowerCase().includes(term),
      );
    }

    if (params.role !== undefined) {
      filtered = filtered.filter((u) => u.role === params.role);
    }

    if (params.active !== undefined) {
      filtered = filtered.filter((u) => u.active === params.active);
    }

    const total = filtered.length;
    const start = (params.page - 1) * params.pageSize;
    const data = filtered.slice(start, start + params.pageSize);

    return of({ data, total, page: params.page, pageSize: params.pageSize });
  }

  getUserById(id: number): Observable<User> {
    const user = this.getUserByIdOrThrow(id);
    if (!user) {
      return throwError(() => new Error(`Usuario con id "${id}" no encontrado`));
    }

    return of({ ...user });
  }

  createUser(payload: CreateUserPayload): Observable<User> {
    const nextId = Math.max(0, ...this.users.map((u) => u.id)) + 1;
    const newUser: User = {
      id: nextId,
      firstName: payload.firstName,
      // Mimics backend masking for users pending their first login.
      lastName: null,
      email: null,
      role: payload.role,
      departmentId: payload.departmentId,
      active: false,
      lastLoginAt: null,
    };
    this.users = [...this.users, newUser];
    return of({ ...newUser });
  }

  updateUser(id: number, payload: UpdateUserPayload): Observable<User> {
    const existing = this.getUserByIdOrThrow(id);
    if (!existing) {
      return throwError(() => new Error(`Usuario con id "${id}" no encontrado`));
    }

    const updated: User = {
      ...existing,
      ...(payload.firstName !== undefined && {
        firstName: payload.firstName ?? existing.firstName,
      }),
      ...(payload.lastName !== undefined && {
        lastName: payload.lastName ?? existing.lastName,
      }),
      ...(payload.role !== undefined && { role: payload.role ?? existing.role }),
      ...(payload.departmentId !== undefined && { departmentId: payload.departmentId }),
    };

    this.users = this.users.map((u) => (u.id === id ? updated : u));
    return of({ ...updated });
  }

  deactivateUser(id: number): Observable<void> {
    if (!this.getUserByIdOrThrow(id)) {
      return throwError(() => new Error(`Usuario con id "${id}" no encontrado`));
    }

    this.users = this.users.map((u) =>
      u.id === id
        ? {
            ...u,
            active: false,
          }
        : u,
    );

    return of(void 0);
  }

  activateUser(id: number): Observable<void> {
    if (!this.getUserByIdOrThrow(id)) {
      return throwError(() => new Error(`Usuario con id "${id}" no encontrado`));
    }

    this.users = this.users.map((u) =>
      u.id === id
        ? {
            ...u,
            active: true,
            lastLoginAt: u.lastLoginAt ?? new Date(0).toISOString(),
          }
        : u,
    );

    return of(void 0);
  }

  deleteUser(id: number): Observable<void> {
    if (!this.getUserByIdOrThrow(id)) {
      return throwError(() => new Error(`Usuario con id "${id}" no encontrado`));
    }

    this.users = this.users.filter((u) => u.id !== id);
    return of(void 0);
  }

  getDepartments(): Observable<Department[]> {
    // TODO: replace with DepartmentRepository when Departments feature becomes available
    return of(INITIAL_MOCK_DEPARTMENTS.map((d) => ({ ...d })));
  }
}

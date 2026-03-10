import { Injectable } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';
import {
  User,
  Department,
  CreateUserPayload,
  UpdateUserPayload,
  UserQueryParams,
  PagedResult,
} from '@domain/models/user.model';

// Minimal departments needed for the user form selector.
// When the Departments feature is implemented, getDepartments() will
// consume that repository. For now they are kept here as support data.
const MOCK_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'Tecnología' },
  { id: 'dept-2', name: 'Recursos Humanos' },
  { id: 'dept-3', name: 'Ventas' },
  { id: 'dept-4', name: 'Administración' },
];

let MOCK_USERS: User[] = [
  {
    id: 'user-1',
    firstName: 'Ana',
    lastName: 'García',
    email: 'ana.garcia@empresa.com',
    role: 'Administrator',
    departmentId: 'dept-4',
    departmentName: 'Administración',
    active: true,
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-01-10T08:00:00Z',
  },
  {
    id: 'user-2',
    firstName: 'Carlos',
    lastName: 'Martínez',
    email: 'carlos.martinez@empresa.com',
    role: 'Manager',
    departmentId: 'dept-1',
    departmentName: 'Tecnología',
    active: true,
    createdAt: '2025-02-01T09:00:00Z',
    updatedAt: '2025-02-01T09:00:00Z',
  },
  {
    id: 'user-3',
    firstName: 'Laura',
    lastName: 'Sánchez',
    email: 'laura.sanchez@gmail.com',
    role: 'Employee',
    departmentId: 'dept-2',
    departmentName: 'Recursos Humanos',
    active: true,
    createdAt: '2025-02-15T10:00:00Z',
    updatedAt: '2025-02-15T10:00:00Z',
  },
  {
    id: 'user-4',
    firstName: 'Pedro',
    lastName: 'López',
    email: 'pedro.lopez@empresa.com',
    role: 'Employee',
    departmentId: 'dept-3',
    departmentName: 'Ventas',
    active: true,
    createdAt: '2025-03-01T11:00:00Z',
    updatedAt: '2025-03-01T11:00:00Z',
  },
  {
    id: 'user-5',
    firstName: 'María',
    lastName: 'Fernández',
    email: 'maria.fernandez@empresa.com',
    role: 'Employee',
    departmentId: 'dept-3',
    departmentName: 'Ventas',
    active: false,
    createdAt: '2025-01-20T08:30:00Z',
    updatedAt: '2025-04-10T14:00:00Z',
  },
  {
    id: 'user-6',
    firstName: 'Javier',
    lastName: 'Ruiz',
    email: 'javier.ruiz@empresa.com',
    role: 'Manager',
    departmentId: 'dept-2',
    departmentName: 'Recursos Humanos',
    active: true,
    createdAt: '2025-03-10T09:00:00Z',
    updatedAt: '2025-03-10T09:00:00Z',
  },
  {
    id: 'user-7',
    firstName: 'Sofía',
    lastName: 'Torres',
    email: 'sofia.torres@gmail.com',
    role: 'Employee',
    departmentId: 'dept-1',
    departmentName: 'Tecnología',
    active: true,
    createdAt: '2025-04-01T10:00:00Z',
    updatedAt: '2025-04-01T10:00:00Z',
  },
  {
    id: 'user-8',
    firstName: 'Diego',
    lastName: 'Morales',
    email: 'diego.morales@empresa.com',
    role: 'Employee',
    departmentId: 'dept-1',
    departmentName: 'Tecnología',
    active: false,
    createdAt: '2025-01-05T08:00:00Z',
    updatedAt: '2025-05-01T16:00:00Z',
  },
];

@Injectable()
export class MockUserRepository implements UserRepository {
  async getUsers(params: UserQueryParams): Promise<PagedResult<User>> {
    let filtered = [...MOCK_USERS];

    if (params.search) {
      const term = params.search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.firstName.toLowerCase().includes(term) ||
          u.lastName.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term),
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

    return { data, total, page: params.page, pageSize: params.pageSize };
  }

  async getUserById(id: string): Promise<User> {
    const user = MOCK_USERS.find((u) => u.id === id);
    if (!user) throw new Error(`Usuario con id "${id}" no encontrado`);
    return { ...user };
  }

  async createUser(payload: CreateUserPayload): Promise<User> {
    const dept = MOCK_DEPARTMENTS.find((d) => d.id === payload.departmentId);
    const now = new Date().toISOString();
    const newUser: User = {
      id: `user-${Date.now()}`,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      role: payload.role,
      departmentId: payload.departmentId,
      departmentName: dept?.name ?? '',
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    MOCK_USERS = [...MOCK_USERS, newUser];
    return { ...newUser };
  }

  async updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
    const index = MOCK_USERS.findIndex((u) => u.id === id);
    if (index === -1) throw new Error(`Usuario con id "${id}" no encontrado`);

    const dept =
      payload.departmentId !== undefined
        ? MOCK_DEPARTMENTS.find((d) => d.id === payload.departmentId)
        : undefined;

    const updated: User = {
      ...MOCK_USERS[index],
      ...(payload.firstName !== undefined && { firstName: payload.firstName }),
      ...(payload.lastName !== undefined && { lastName: payload.lastName }),
      ...(payload.role !== undefined && { role: payload.role }),
      ...(payload.departmentId !== undefined && {
        departmentId: payload.departmentId,
        departmentName: dept?.name ?? MOCK_USERS[index].departmentName,
      }),
      updatedAt: new Date().toISOString(),
    };

    MOCK_USERS = MOCK_USERS.map((u) => (u.id === id ? updated : u));
    return { ...updated };
  }

  async toggleUserStatus(id: string, active: boolean): Promise<User> {
    const index = MOCK_USERS.findIndex((u) => u.id === id);
    if (index === -1) throw new Error(`Usuario con id "${id}" no encontrado`);

    const updated: User = {
      ...MOCK_USERS[index],
      active,
      updatedAt: new Date().toISOString(),
    };

    MOCK_USERS = MOCK_USERS.map((u) => (u.id === id ? updated : u));
    return { ...updated };
  }

  async getDepartments(): Promise<Department[]> {
    // TODO: replace with DepartmentRepository when Departments feature becomes available
    return [...MOCK_DEPARTMENTS];
  }
}

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
  },
  {
    id: 2,
    firstName: 'Carlos',
    lastName: 'Martinez',
    email: 'carlos.martinez@empresa.com',
    role: UserRole.Manager,
    departmentId: 1,
    active: true,
  },
  {
    id: 3,
    firstName: 'Laura',
    lastName: 'Sanchez',
    email: 'laura.sanchez@gmail.com',
    role: UserRole.Employee,
    departmentId: 2,
    active: true,
  },
  {
    id: 4,
    firstName: 'Pedro',
    lastName: 'Lopez',
    email: 'pedro.lopez@empresa.com',
    role: UserRole.Employee,
    departmentId: 3,
    active: true,
  },
  {
    id: 5,
    firstName: 'Maria',
    lastName: 'Fernandez',
    email: 'maria.fernandez@empresa.com',
    role: UserRole.Employee,
    departmentId: 3,
    active: false,
  },
  {
    id: 6,
    firstName: 'Javier',
    lastName: 'Ruiz',
    email: 'javier.ruiz@empresa.com',
    role: UserRole.Manager,
    departmentId: 2,
    active: true,
  },
  {
    id: 7,
    firstName: 'Sofia',
    lastName: 'Torres',
    email: 'sofia.torres@gmail.com',
    role: UserRole.Employee,
    departmentId: 1,
    active: true,
  },
  {
    id: 8,
    firstName: 'Diego',
    lastName: 'Morales',
    email: 'diego.morales@empresa.com',
    role: UserRole.Employee,
    departmentId: 1,
    active: false,
  },
];

@Injectable()
export class MockUserRepository implements UserRepository {
  private users: User[];

  constructor() {
  
    this.users = INITIAL_MOCK_USERS.map((u) => ({ ...u }));
  }

  private getUserByIdOrThrow(id: number): User {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new Error(`Usuario con id "${id}" no encontrado`);
    return user;
  }

  async getUsers(params: UserQueryParams): Promise<PagedResult<User>> {
    let filtered = [...this.users];

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

  async getUserById(id: number): Promise<User> {
    const user = this.getUserByIdOrThrow(id);
    return { ...user };
  }

  async createUser(payload: CreateUserPayload): Promise<User> {
    const nextId = Math.max(0, ...this.users.map((u) => u.id)) + 1;
    const newUser: User = {
      id: nextId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      role: payload.role,
      departmentId: payload.departmentId,
      active: true,
    };
    this.users = [...this.users, newUser];
    return { ...newUser };
  }

  async updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
    const existing = this.getUserByIdOrThrow(id);

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
    return { ...updated };
  }

  async toggleUserStatus(id: number, active: boolean): Promise<void> {
    this.getUserByIdOrThrow(id);
    this.users = this.users.map((u) => (u.id === id ? { ...u, active } : u));
  }

  async getDepartments(): Promise<Department[]> {
    // TODO: replace with DepartmentRepository when Departments feature becomes available
    return INITIAL_MOCK_DEPARTMENTS.map((d) => ({ ...d }));
  }
}

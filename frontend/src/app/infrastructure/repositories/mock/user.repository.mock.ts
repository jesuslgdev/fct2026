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
  { id: 1, name: 'Tecnologia' },
  { id: 2, name: 'Recursos Humanos' },
  { id: 3, name: 'Ventas' },
  { id: 4, name: 'Administracion' },
];

let MOCK_USERS: User[] = [
  {
    id: 1,
    firstName: 'Ana',
    lastName: 'Garcia',
    email: 'ana.garcia@empresa.com',
    role: 'Administrator',
    departmentId: 4,
    active: true,
  },
  {
    id: 2,
    firstName: 'Carlos',
    lastName: 'Martinez',
    email: 'carlos.martinez@empresa.com',
    role: 'Manager',
    departmentId: 1,
    active: true,
  },
  {
    id: 3,
    firstName: 'Laura',
    lastName: 'Sanchez',
    email: 'laura.sanchez@gmail.com',
    role: 'Employee',
    departmentId: 2,
    active: true,
  },
  {
    id: 4,
    firstName: 'Pedro',
    lastName: 'Lopez',
    email: 'pedro.lopez@empresa.com',
    role: 'Employee',
    departmentId: 3,
    active: true,
  },
  {
    id: 5,
    firstName: 'Maria',
    lastName: 'Fernandez',
    email: 'maria.fernandez@empresa.com',
    role: 'Employee',
    departmentId: 3,
    active: false,
  },
  {
    id: 6,
    firstName: 'Javier',
    lastName: 'Ruiz',
    email: 'javier.ruiz@empresa.com',
    role: 'Manager',
    departmentId: 2,
    active: true,
  },
  {
    id: 7,
    firstName: 'Sofia',
    lastName: 'Torres',
    email: 'sofia.torres@gmail.com',
    role: 'Employee',
    departmentId: 1,
    active: true,
  },
  {
    id: 8,
    firstName: 'Diego',
    lastName: 'Morales',
    email: 'diego.morales@empresa.com',
    role: 'Employee',
    departmentId: 1,
    active: false,
  },
  {
    id: 9,
    firstName: 'José',
    lastName: 'Pérez',
    email: 'jose.perez@empresa.com',
    role: 'Employee',
    departmentId: 1,
    active: true,
  },
  {
    id: 10,
    firstName: 'Lucía',
    lastName: 'Gómez',
    email: 'lucia.gomez@empresa.com',
    role: 'Manager',
    departmentId: 2,
    active: true,
  },
  {
    id: 11,
    firstName: 'Raúl',
    lastName: 'Díaz',
    email: 'raul.diaz@empresa.com',
    role: 'Employee',
    departmentId: 3,
    active: false,
  },
  {
    id: 12,
    firstName: 'Elena',
    lastName: 'Ruiz',
    email: 'elena.ruiz@empresa.com',
    role: 'Administrator',
    departmentId: 4,
    active: true,
  },
  {
    id: 13,
    firstName: 'Miguel',
    lastName: 'Sánchez',
    email: 'miguel.sanchez@empresa.com',
    role: 'Employee',
    departmentId: 1,
    active: true,
  },
  {
    id: 14,
    firstName: 'Isabel',
    lastName: 'Herrera',
    email: 'isabel.herrera@empresa.com',
    role: 'Manager',
    departmentId: 2,
    active: true,
  },
  {
    id: 15,
    firstName: 'Antonio',
    lastName: 'Castillo',
    email: 'antonio.castillo@empresa.com',
    role: 'Employee',
    departmentId: 3,
    active: true,
  },
  {
    id: 16,
    firstName: 'Carmen',
    lastName: 'Vega',
    email: 'carmen.vega@empresa.com',
    role: 'Employee',
    departmentId: 4,
    active: false,
  },
  {
    id: 17,
    firstName: 'Pablo',
    lastName: 'Navarro',
    email: 'pablo.navarro@empresa.com',
    role: 'Employee',
    departmentId: 1,
    active: true,
  },
  {
    id: 18,
    firstName: 'Nuria',
    lastName: 'Ortiz',
    email: 'nuria.ortiz@empresa.com',
    role: 'Manager',
    departmentId: 2,
    active: true,
  },
  {
    id: 19,
    firstName: 'Sergio',
    lastName: 'Muñoz',
    email: 'sergio.munoz@empresa.com',
    role: 'Employee',
    departmentId: 3,
    active: true,
  },
  {
    id: 20,
    firstName: 'Paula',
    lastName: 'Blanco',
    email: 'paula.blanco@empresa.com',
    role: 'Employee',
    departmentId: 4,
    active: false,
  },
  {
    id: 21,
    firstName: 'Víctor',
    lastName: 'Ramos',
    email: 'victor.ramos@empresa.com',
    role: 'Manager',
    departmentId: 1,
    active: true,
  },
  {
    id: 22,
    firstName: 'Alicia',
    lastName: 'Mendoza',
    email: 'alicia.mendoza@empresa.com',
    role: 'Employee',
    departmentId: 2,
    active: true,
  },
  {
    id: 23,
    firstName: 'Fernando',
    lastName: 'Ríos',
    email: 'fernando.rios@empresa.com',
    role: 'Employee',
    departmentId: 3,
    active: true,
  },
  {
    id: 24,
    firstName: 'Teresa',
    lastName: 'Alonso',
    email: 'teresa.alonso@empresa.com',
    role: 'Administrator',
    departmentId: 4,
    active: true,
  },
  {
    id: 25,
    firstName: 'Ramón',
    lastName: 'Flores',
    email: 'ramon.flores@empresa.com',
    role: 'Employee',
    departmentId: 1,
    active: false,
  },
  {
    id: 26,
    firstName: 'Marta',
    lastName: 'Gil',
    email: 'marta.gil@empresa.com',
    role: 'Employee',
    departmentId: 2,
    active: true,
  },
  {
    id: 27,
    firstName: 'Alberto',
    lastName: 'Cortés',
    email: 'alberto.cortes@empresa.com',
    role: 'Manager',
    departmentId: 3,
    active: true,
  },
  {
    id: 28,
    firstName: 'Rosa',
    lastName: 'León',
    email: 'rosa.leon@empresa.com',
    role: 'Employee',
    departmentId: 4,
    active: true,
  },
  {
    id: 29,
    firstName: 'Javier',
    lastName: 'Martín',
    email: 'javier.martin@empresa.com',
    role: 'Employee',
    departmentId: 1,
    active: true,
  },
  {
    id: 30,
    firstName: 'Sonia',
    lastName: 'Paredes',
    email: 'sonia.paredes@empresa.com',
    role: 'Employee',
    departmentId: 2,
    active: false,
  },
  {
    id: 31,
    firstName: 'Jesus',
    lastName: 'Lobato',
    email: 'jesus.lobato@empresa.com',
    role: 'Employee',
    departmentId: 2,
    active: false,
  },
  {
    id: 'user-9',
    firstName: 'José',
    lastName: 'Pérez',
    email: 'jose.perez@empresa.com',
    role: 'Employee',
    departmentId: 'dept-1',
    departmentName: 'Tecnología',
    active: true,
    createdAt: '2025-05-02T08:00:00Z',
    updatedAt: '2025-05-02T08:00:00Z',
  },
  {
    id: 'user-10',
    firstName: 'Lucía',
    lastName: 'Gómez',
    email: 'lucia.gomez@empresa.com',
    role: 'Manager',
    departmentId: 'dept-2',
    departmentName: 'Recursos Humanos',
    active: true,
    createdAt: '2025-05-05T09:00:00Z',
    updatedAt: '2025-05-05T09:00:00Z',
  },
  {
    id: 'user-11',
    firstName: 'Raúl',
    lastName: 'Díaz',
    email: 'raul.diaz@empresa.com',
    role: 'Employee',
    departmentId: 'dept-3',
    departmentName: 'Ventas',
    active: false,
    createdAt: '2025-05-10T10:00:00Z',
    updatedAt: '2025-05-10T10:00:00Z',
  },
  {
    id: 'user-12',
    firstName: 'Elena',
    lastName: 'Ruiz',
    email: 'elena.ruiz@empresa.com',
    role: 'Administrator',
    departmentId: 'dept-4',
    departmentName: 'Administración',
    active: true,
    createdAt: '2025-05-12T11:00:00Z',
    updatedAt: '2025-05-12T11:00:00Z',
  },
  {
    id: 'user-13',
    firstName: 'Miguel',
    lastName: 'Sánchez',
    email: 'miguel.sanchez@empresa.com',
    role: 'Employee',
    departmentId: 'dept-1',
    departmentName: 'Tecnología',
    active: true,
    createdAt: '2025-05-15T12:00:00Z',
    updatedAt: '2025-05-15T12:00:00Z',
  },
  {
    id: 'user-14',
    firstName: 'Isabel',
    lastName: 'Herrera',
    email: 'isabel.herrera@empresa.com',
    role: 'Manager',
    departmentId: 'dept-2',
    departmentName: 'Recursos Humanos',
    active: true,
    createdAt: '2025-05-18T13:00:00Z',
    updatedAt: '2025-05-18T13:00:00Z',
  },
  {
    id: 'user-15',
    firstName: 'Antonio',
    lastName: 'Castillo',
    email: 'antonio.castillo@empresa.com',
    role: 'Employee',
    departmentId: 'dept-3',
    departmentName: 'Ventas',
    active: true,
    createdAt: '2025-05-20T14:00:00Z',
    updatedAt: '2025-05-20T14:00:00Z',
  },
  {
    id: 'user-16',
    firstName: 'Carmen',
    lastName: 'Vega',
    email: 'carmen.vega@empresa.com',
    role: 'Employee',
    departmentId: 'dept-4',
    departmentName: 'Administración',
    active: false,
    createdAt: '2025-05-22T15:00:00Z',
    updatedAt: '2025-05-22T15:00:00Z',
  },
  {
    id: 'user-17',
    firstName: 'Pablo',
    lastName: 'Navarro',
    email: 'pablo.navarro@empresa.com',
    role: 'Employee',
    departmentId: 'dept-1',
    departmentName: 'Tecnología',
    active: true,
    createdAt: '2025-05-25T16:00:00Z',
    updatedAt: '2025-05-25T16:00:00Z',
  },
  {
    id: 'user-18',
    firstName: 'Nuria',
    lastName: 'Ortiz',
    email: 'nuria.ortiz@empresa.com',
    role: 'Manager',
    departmentId: 'dept-2',
    departmentName: 'Recursos Humanos',
    active: true,
    createdAt: '2025-05-28T17:00:00Z',
    updatedAt: '2025-05-28T17:00:00Z',
  },
  {
    id: 'user-19',
    firstName: 'Sergio',
    lastName: 'Muñoz',
    email: 'sergio.munoz@empresa.com',
    role: 'Employee',
    departmentId: 'dept-3',
    departmentName: 'Ventas',
    active: true,
    createdAt: '2025-05-30T18:00:00Z',
    updatedAt: '2025-05-30T18:00:00Z',
  },
  {
    id: 'user-20',
    firstName: 'Paula',
    lastName: 'Blanco',
    email: 'paula.blanco@empresa.com',
    role: 'Employee',
    departmentId: 'dept-4',
    departmentName: 'Administración',
    active: false,
    createdAt: '2025-06-01T19:00:00Z',
    updatedAt: '2025-06-01T19:00:00Z',
  },
  {
    id: 'user-21',
    firstName: 'Víctor',
    lastName: 'Ramos',
    email: 'victor.ramos@empresa.com',
    role: 'Manager',
    departmentId: 'dept-1',
    departmentName: 'Tecnología',
    active: true,
    createdAt: '2025-06-03T20:00:00Z',
    updatedAt: '2025-06-03T20:00:00Z',
  },
  {
    id: 'user-22',
    firstName: 'Alicia',
    lastName: 'Mendoza',
    email: 'alicia.mendoza@empresa.com',
    role: 'Employee',
    departmentId: 'dept-2',
    departmentName: 'Recursos Humanos',
    active: true,
    createdAt: '2025-06-05T21:00:00Z',
    updatedAt: '2025-06-05T21:00:00Z',
  },
  {
    id: 'user-23',
    firstName: 'Fernando',
    lastName: 'Ríos',
    email: 'fernando.rios@empresa.com',
    role: 'Employee',
    departmentId: 'dept-3',
    departmentName: 'Ventas',
    active: true,
    createdAt: '2025-06-07T22:00:00Z',
    updatedAt: '2025-06-07T22:00:00Z',
  },
  {
    id: 'user-24',
    firstName: 'Teresa',
    lastName: 'Alonso',
    email: 'teresa.alonso@empresa.com',
    role: 'Administrator',
    departmentId: 'dept-4',
    departmentName: 'Administración',
    active: true,
    createdAt: '2025-06-09T23:00:00Z',
    updatedAt: '2025-06-09T23:00:00Z',
  },
  {
    id: 'user-25',
    firstName: 'Ramón',
    lastName: 'Flores',
    email: 'ramon.flores@empresa.com',
    role: 'Employee',
    departmentId: 'dept-1',
    departmentName: 'Tecnología',
    active: false,
    createdAt: '2025-06-10T07:00:00Z',
    updatedAt: '2025-06-10T07:00:00Z',
  },
  {
    id: 'user-26',
    firstName: 'Marta',
    lastName: 'Gil',
    email: 'marta.gil@empresa.com',
    role: 'Employee',
    departmentId: 'dept-2',
    departmentName: 'Recursos Humanos',
    active: true,
    createdAt: '2025-06-11T08:00:00Z',
    updatedAt: '2025-06-11T08:00:00Z',
  },
  {
    id: 'user-27',
    firstName: 'Alberto',
    lastName: 'Cortés',
    email: 'alberto.cortes@empresa.com',
    role: 'Manager',
    departmentId: 'dept-3',
    departmentName: 'Ventas',
    active: true,
    createdAt: '2025-06-12T09:00:00Z',
    updatedAt: '2025-06-12T09:00:00Z',
  },
  {
    id: 'user-28',
    firstName: 'Rosa',
    lastName: 'León',
    email: 'rosa.leon@empresa.com',
    role: 'Employee',
    departmentId: 'dept-4',
    departmentName: 'Administración',
    active: true,
    createdAt: '2025-06-13T10:00:00Z',
    updatedAt: '2025-06-13T10:00:00Z',
  },
  {
    id: 'user-29',
    firstName: 'Javier',
    lastName: 'Martín',
    email: 'javier.martin@empresa.com',
    role: 'Employee',
    departmentId: 'dept-1',
    departmentName: 'Tecnología',
    active: true,
    createdAt: '2025-06-14T11:00:00Z',
    updatedAt: '2025-06-14T11:00:00Z',
  },
  {
    id: 'user-30',
    firstName: 'Sonia',
    lastName: 'Paredes',
    email: 'sonia.paredes@empresa.com',
    role: 'Employee',
    departmentId: 'dept-2',
    departmentName: 'Recursos Humanos',
    active: false,
    createdAt: '2025-06-15T12:00:00Z',
    updatedAt: '2025-06-15T12:00:00Z',
  },
    {
    id: 'user-31',
    firstName: 'Jesus',
    lastName: 'Lobato',
    email: 'jesus.lobato@empresa.com',
    role: 'Employee',
    departmentId: 'dept-2',
    departmentName: 'Recursos Humanos',
    active: false,
    createdAt: '2025-06-15T12:00:00Z',
    updatedAt: '2025-06-15T12:00:00Z',
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

    // TODO: restore server-side paging behavior when HTTP repository is wired.
    // The mock returns all filtered rows so PrimeNG client paginator can handle pages.
    return { data: filtered, total, page: 1, pageSize: total };
  }

  async getUserById(id: number): Promise<User> {
    const user = MOCK_USERS.find((u) => u.id === id);
    if (!user) throw new Error(`Usuario con id "${id}" no encontrado`);
    return { ...user };
  }

  async createUser(payload: CreateUserPayload): Promise<User> {
    const nextId = Math.max(0, ...MOCK_USERS.map((u) => u.id)) + 1;
    const newUser: User = {
      id: nextId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      role: payload.role,
      departmentId: payload.departmentId,
      active: true,
    };
    MOCK_USERS = [...MOCK_USERS, newUser];
    return { ...newUser };
  }

  async updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
    const index = MOCK_USERS.findIndex((u) => u.id === id);
    if (index === -1) throw new Error(`Usuario con id "${id}" no encontrado`);

    const updated: User = {
      ...MOCK_USERS[index],
      ...(payload.firstName !== undefined && {
        firstName: payload.firstName ?? MOCK_USERS[index].firstName,
      }),
      ...(payload.lastName !== undefined && {
        lastName: payload.lastName ?? MOCK_USERS[index].lastName,
      }),
      ...(payload.role !== undefined && { role: payload.role ?? MOCK_USERS[index].role }),
      ...(payload.departmentId !== undefined && { departmentId: payload.departmentId }),
    };

    MOCK_USERS = MOCK_USERS.map((u) => (u.id === id ? updated : u));
    return { ...updated };
  }

  async toggleUserStatus(id: number, active: boolean): Promise<void> {
    const index = MOCK_USERS.findIndex((u) => u.id === id);
    if (index === -1) throw new Error(`Usuario con id "${id}" no encontrado`);

    MOCK_USERS = MOCK_USERS.map((u) => (u.id === id ? { ...u, active } : u));
  }

  async getDepartments(): Promise<Department[]> {
    // TODO: replace with DepartmentRepository when Departments feature becomes available
    return [...MOCK_DEPARTMENTS];
  }
}


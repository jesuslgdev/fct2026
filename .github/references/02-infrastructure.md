# Paso 2 — Capa Infrastructure

La capa infrastructure implementa los contratos definidos en domain. Contiene DTOs, mappers y repositorios concretos (mock y HTTP).

**Puede depender de**: `@domain/*`
**NO puede depender de**: `@features/*`

---

## 2.1 DTOs

Archivo: `frontend/src/app/infrastructure/dtos/<entity>.dto.ts`

Los DTOs reflejan la forma exacta del JSON que devuelve/recibe el API REST. Usan **snake_case** como convención de backend.

```typescript
// Ejemplo real: infrastructure/dtos/user.dto.ts
import { UserRole } from '@domain/enums/user-role.enum';

// DTO de lectura (lo que devuelve el API)
export interface UserDto {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  department_id: number | null;
  is_active: boolean;
}

// DTO de creación (lo que se envía al API para crear)
export interface CreateUserDto {
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  department_id: number | null;
}

// DTO de actualización
export interface UpdateUserDto {
  first_name?: string | null;
  last_name?: string | null;
  role?: UserRole | null;
  department_id?: number | null;
}

// DTOs auxiliares
export interface SetUserActiveDto {
  is_active: boolean;
}

export interface UsersPageDto {
  items: UserDto[];
  total: number;
  page: number;
  page_size: number;
}

export interface DepartmentDto {
  department_id: number;
  name: string;
}
```

### Reglas:
- Propiedades en **snake_case** (reflejan el API).
- Un DTO por cada shape del API: lectura, creación, actualización, paginación.
- Los enums compartidos se importan de `@domain/enums/`.
- Si el backend usa un campo distinto para el ID (ej: `user_id` vs `id`), el DTO lo refleja tal cual.
- No incluir lógica ni métodos. Solo interfaces.

---

## 2.2 Mappers

Archivo: `frontend/src/app/infrastructure/mappers/<entity>.mapper.ts`

Clase estática que convierte entre DTOs (snake_case) y modelos de dominio (camelCase).

```typescript
// Ejemplo real: infrastructure/mappers/user.mapper.ts
import {
  User,
  Department,
  CreateUserPayload,
  UpdateUserPayload,
} from '@domain/models/user.model';
import {
  UserDto,
  CreateUserDto,
  UpdateUserDto,
  DepartmentDto,
} from '@infrastructure/dtos/user.dto';

export class UserMapper {
  // DTO → Domain
  static fromDto(dto: UserDto): User {
    return {
      id: dto.user_id,
      firstName: dto.first_name,
      lastName: dto.last_name,
      email: dto.email,
      role: dto.role,
      departmentId: dto.department_id,
      active: dto.is_active,
    };
  }

  // Entidad auxiliar DTO → Domain
  static departmentFromDto(dto: DepartmentDto): Department {
    return {
      id: dto.department_id,
      name: dto.name,
    };
  }

  // Domain → DTO (para crear)
  static toCreateDto(payload: CreateUserPayload): CreateUserDto {
    return {
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      role: payload.role,
      department_id: payload.departmentId,
    };
  }

  // Domain → DTO (para actualizar, solo campos presentes)
  static toUpdateDto(payload: UpdateUserPayload): UpdateUserDto {
    return {
      ...(payload.firstName !== undefined && { first_name: payload.firstName }),
      ...(payload.lastName !== undefined && { last_name: payload.lastName }),
      ...(payload.role !== undefined && { role: payload.role }),
      ...(payload.departmentId !== undefined && {
        department_id: payload.departmentId,
      }),
    };
  }
}
```

### Reglas:
- Clase con métodos **static** (sin estado, sin inyección).
- `fromDto()`: convierte DTO a modelo de dominio.
- `toCreateDto()` / `toUpdateDto()`: convierte payload de dominio a DTO.
- En updateDto, solo incluir campos que no son `undefined` (spread condicional).
- Un mapper por entidad.

---

## 2.3 Mock Repository

Archivo: `frontend/src/app/infrastructure/repositories/mock/<entity>.repository.mock.ts`

Implementa el contrato de repositorio con datos hardcoded. Se usa durante desarrollo.

```typescript
// Ejemplo real: infrastructure/repositories/mock/user.repository.mock.ts
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

const SEED_DEPARTMENTS: Department[] = [
  { id: 1, name: 'Tecnologia' },
  { id: 2, name: 'Recursos Humanos' },
  { id: 3, name: 'Ventas' },
  { id: 4, name: 'Administracion' },
];

const SEED_USERS: User[] = [
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
  // ... más datos mock (mínimo 5-8 registros variados)
];

@Injectable()
export class MockUserRepository implements UserRepository {
  private users = structuredClone(SEED_USERS);
  private departments = structuredClone(SEED_DEPARTMENTS);

  async getUsers(params: UserQueryParams): Promise<PagedResult<User>> {
    let filtered = [...this.users];

    // Filtro por búsqueda de texto
    if (params.search) {
      const term = params.search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.firstName.toLowerCase().includes(term) ||
          u.lastName.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term),
      );
    }

    // Filtros adicionales
    if (params.role !== undefined) {
      filtered = filtered.filter((u) => u.role === params.role);
    }
    if (params.active !== undefined) {
      filtered = filtered.filter((u) => u.active === params.active);
    }

    // Paginación client-side
    const total = filtered.length;
    const start = (params.page - 1) * params.pageSize;
    const data = filtered.slice(start, start + params.pageSize);

    return { data, total, page: params.page, pageSize: params.pageSize };
  }

  async getUserById(id: number): Promise<User> {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new Error(`Entity with id "${id}" not found`);
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
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error(`Entity with id "${id}" not found`);

    const updated: User = {
      ...this.users[index],
      ...(payload.firstName !== undefined && {
        firstName: payload.firstName ?? this.users[index].firstName,
      }),
      ...(payload.lastName !== undefined && {
        lastName: payload.lastName ?? this.users[index].lastName,
      }),
      ...(payload.role !== undefined && { role: payload.role ?? this.users[index].role }),
      ...(payload.departmentId !== undefined && { departmentId: payload.departmentId }),
    };

    this.users = this.users.map((u) => (u.id === id ? updated : u));
    return { ...updated };
  }

  async toggleUserStatus(id: number, active: boolean): Promise<void> {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error(`Entity with id "${id}" not found`);
    this.users = this.users.map((u) => (u.id === id ? { ...u, active } : u));
  }

  async getDepartments(): Promise<Department[]> {
    return [...this.departments];
  }
}
```

### Reglas:
- `@Injectable()` (sin `providedIn` — se registra manualmente en `app.config.ts`).
- `implements <Entity>Repository`.
- **Datos semilla con `const`** (`SEED_USERS`, `SEED_DEPARTMENTS`). Nunca `let`.
- **Copia por instancia** con `structuredClone()` en propiedades de la clase. Así cada instancia (y cada test) arranca con datos limpios y no hay contaminación entre tests.
- Operaciones CRUD mutan `this.users` / `this.departments`, no la constante del módulo.
- Siempre retornar copias (`{ ...entity }`, `[...array]`) para evitar mutación accidental.
- `getUsers` implementa filtrado y paginación client-side.
- Mínimo 5-8 registros con datos variados (distintos roles, estados, etc).
- Comentario TODO si un método necesitará otro repositorio en el futuro:
  ```typescript
  // TODO: replace with DepartmentRepository when Departments feature becomes available
  ```

---

## 2.4 HTTP Repository

Archivo: `frontend/src/app/infrastructure/repositories/http/<entity>.repository.http.ts`

Implementación real que usa `HttpClient` de Angular.

```typescript
// Ejemplo real: infrastructure/repositories/http/user.repository.http.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { UserRepository } from '@domain/repositories/user.repository';
import {
  UserApiError,
  UserForbiddenError,
  UserNotFoundError,
  UserUnauthorizedError,
  UserValidationError,
} from '@domain/models/user-errors';
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
import { environment } from 'environments/environment';

// TODO add base url for API REST
const BASE_URL = `${environment.apiUrl}/api/v1/admin/<entities>`;

@Injectable()
export class HttpUserRepository implements UserRepository {
  private readonly http = inject(HttpClient);

  // ── Error mapping centralizado ─────────────────────────────────────────
  private async withErrorMapping<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (err) {
      throw this.mapHttpError(err);
    }
  }

  private mapHttpError(err: unknown): Error {
    if (!(err instanceof HttpErrorResponse)) {
      return err instanceof Error ? err : new UserApiError();
    }

    const message = this.extractErrorMessage(err);

    switch (err.status) {
      case 400:
      case 422:
        return new UserValidationError(err.error, message ?? 'Validation failed.');
      case 401:
        return new UserUnauthorizedError(message ?? 'Authentication required.');
      case 403:
        return new UserForbiddenError(message ?? 'Insufficient permissions.');
      case 404:
        return new UserNotFoundError(message ?? 'Entity not found.');
      default:
        return new UserApiError(message ?? 'Unexpected API error.');
    }
  }

  private extractErrorMessage(err: HttpErrorResponse): string | undefined {
    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }
    if (err.error && typeof err.error === 'object') {
      const payload = err.error as Record<string, unknown>;
      const rawMessage = payload['message'];
      const rawDetail = payload['detail'];
      if (typeof rawMessage === 'string' && rawMessage.trim()) return rawMessage;
      if (typeof rawDetail === 'string' && rawDetail.trim()) return rawDetail;
    }
    return undefined;
  }

  // ── Operaciones CRUD ───────────────────────────────────────────────────
  async getUsers(params: UserQueryParams): Promise<PagedResult<User>> {
    return this.withErrorMapping(async () => {
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
    });
  }

  async getUserById(id: number): Promise<User> {
    return this.withErrorMapping(async () => {
      const dto = await firstValueFrom(this.http.get<UserDto>(`${BASE_URL}/${id}`));
      return UserMapper.fromDto(dto);
    });
  }

  async createUser(payload: CreateUserPayload): Promise<User> {
    return this.withErrorMapping(async () => {
      const dto = await firstValueFrom(
        this.http.post<UserDto>(BASE_URL, UserMapper.toCreateDto(payload)),
      );
      return UserMapper.fromDto(dto);
    });
  }

  async updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
    return this.withErrorMapping(async () => {
      const dto = await firstValueFrom(
        this.http.patch<UserDto>(`${BASE_URL}/${id}`, UserMapper.toUpdateDto(payload)),
      );
      return UserMapper.fromDto(dto);
    });
  }

  async toggleUserStatus(id: number, active: boolean): Promise<void> {
    return this.withErrorMapping(async () => {
      const body: SetUserActiveDto = { is_active: active };
      await firstValueFrom(this.http.patch<void>(`${BASE_URL}/${id}/active`, body));
    });
  }

  async getDepartments(): Promise<Department[]> {
    return this.withErrorMapping(async () => {
      const dtos = await firstValueFrom(
        this.http.get<DepartmentDto[]>(`${environment.apiUrl}/api/v1/admin/departments`),
      );
      return dtos.map(UserMapper.departmentFromDto);
    });
  }
}
```

### Reglas:
- `@Injectable()` sin `providedIn`.
- Inyecta `HttpClient` con `inject()`.
- Usa `firstValueFrom()` para convertir Observable → Promise.
- **Error mapping centralizado** con `withErrorMapping()` — cada método lo usa.
- Mapea `HttpErrorResponse.status` a errores de dominio tipados.
- `extractErrorMessage()` intenta leer `message` o `detail` del body del error.
- URLs construidas con `environment.apiUrl`.
- Usa el Mapper para toda conversión DTO ↔ Domain.
- Verbos HTTP estándar: GET (lista), GET/:id, POST, **PATCH/:id (update parcial)**, PATCH/:id/active (toggle), DELETE/:id.
- **PATCH para updates parciales**, PUT solo si se reemplaza la entidad completa. Consultar con el equipo de backend.

---

## 2.5 Registro en app.config.ts

```typescript
// En frontend/src/app/app.config.ts
import { HttpUserRepository } from '@infrastructure/repositories/http/user.repository.http';
import { UserRepository } from '@domain/repositories/user.repository';

// Durante desarrollo con mocks:
// import { MockUserRepository } from '@infrastructure/repositories/mock/user.repository.mock';
// { provide: UserRepository, useClass: MockUserRepository },

// En producción / con API real:
{ provide: UserRepository, useClass: HttpUserRepository },
```

### Reglas:
- Siempre empezar con Mock para desarrollo rápido.
- Cambiar a HTTP cuando el backend esté disponible.
- El comentario de mock se deja como referencia.

---

## 2.6 Checklist de infrastructure

- [ ] DTOs que reflejan exactamente el shape del API (snake_case)
- [ ] Mapper estático con `fromDto()` y `toCreateDto()` / `toUpdateDto()`
- [ ] Mock repository con `@Injectable()`, datos variados, filtrado y paginación
- [ ] HTTP repository con error mapping, Mapper y `firstValueFrom()`
- [ ] URL base con `environment.apiUrl`
- [ ] Registro del provider en `app.config.ts`
- [ ] Cero imports de `@features/*`

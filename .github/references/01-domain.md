# Paso 1 — Capa Domain

La capa domain contiene la lógica de negocio pura. **NO** depende de Angular (excepto `inject()`), HTTP, ni de ninguna otra capa.

## 1.1 Enums

Archivo: `frontend/src/app/domain/enums/<entity>-<concept>.enum.ts`

Patrón: type union + array constante para iterar en selects.

```typescript
// Ejemplo real: domain/enums/user-role.enum.ts
export type UserRole = 'Employee' | 'Manager' | 'Administrator';

export const USER_ROLES: UserRole[] = ['Employee', 'Manager', 'Administrator'];
```

### Reglas:
- Usar **type union** (no `enum` de TypeScript) para mejor tree-shaking.
- Exportar un array constante `<ENTITY>_<CONCEPT>S` para uso en selects/filtros.
- Valores en inglés (la traducción es responsabilidad de la UI).

---

## 1.2 Modelos

Archivo: `frontend/src/app/domain/models/<entity>.model.ts`

Contiene: entidad principal, entidades auxiliares, payloads de creación/actualización, parámetros de query y resultado paginado.

```typescript
// Ejemplo real: domain/models/user.model.ts
import { UserRole } from '@domain/enums/user-role.enum';

// Entidad principal
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  departmentId: number | null;
  active: boolean;
}

// Entidad auxiliar (si la feature la necesita)
export interface Department {
  id: number;
  name: string;
}

// Payload de creación (sin id, sin campos auto-generados)
export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  departmentId: number | null;
}

// Payload de actualización (campos opcionales)
export interface UpdateUserPayload {
  firstName?: string | null;
  lastName?: string | null;
  role?: UserRole | null;
  departmentId?: number | null;
}

// Parámetros de consulta para listados
export interface UserQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  role?: UserRole;
  active?: boolean;
}

// Resultado paginado genérico
export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

### Reglas:
- IDs numéricos (`number`), no strings.
- Propiedades en **camelCase**.
- Campos nullable con `| null`, no `?:`.
- Payload de creación: solo campos que el usuario introduce.
- Payload de actualización: todos opcionales con `?:` y `| null`.
- `PagedResult<T>` es genérico y reutilizable (si ya existe en el proyecto, reutilizarlo).
- No importar nada de `@infrastructure/*` ni `@features/*`.

---

## 1.3 Errores tipados

Archivo: `frontend/src/app/domain/models/<entity>-errors.ts`

Cada feature define sus errores de dominio como clases que extienden `Error`. Esto permite al store mapear errores a mensajes UI específicos.

```typescript
// Ejemplo real: domain/models/user-errors.ts
export class UserValidationError extends Error {
  override readonly name = 'UserValidationError';

  constructor(
    public readonly details: unknown,
    message = 'Validation failed.',
  ) {
    super(message);
  }
}

export class UserUnauthorizedError extends Error {
  override readonly name = 'UserUnauthorizedError';
  constructor(message = 'Authentication required.') {
    super(message);
  }
}

export class UserForbiddenError extends Error {
  override readonly name = 'UserForbiddenError';
  constructor(message = 'Insufficient permissions.') {
    super(message);
  }
}

export class UserNotFoundError extends Error {
  override readonly name = 'UserNotFoundError';
  constructor(message = 'User not found.') {
    super(message);
  }
}

export class UserApiError extends Error {
  override readonly name = 'UserApiError';
  constructor(message = 'Unexpected users API error.') {
    super(message);
  }
}
```

### Reglas:
- Prefijo con el nombre de la entidad: `<Entity>ValidationError`, `<Entity>NotFoundError`, etc.
- `override readonly name` para que `instanceof` funcione correctamente.
- `ValidationError` recibe `details: unknown` para transportar datos extra del backend.
- Errores estándar: `Validation`, `Unauthorized`, `Forbidden`, `NotFound`, `ApiError`.

---

## 1.4 Contrato de repositorio

Archivo: `frontend/src/app/domain/repositories/<entity>.repository.ts`

Es una **clase abstracta** (no interface) para poder usarla como token de inyección de Angular.

```typescript
// Ejemplo real: domain/repositories/user.repository.ts
import {
  User,
  Department,
  CreateUserPayload,
  UpdateUserPayload,
  UserQueryParams,
  PagedResult,
} from '@domain/models/user.model';

export abstract class UserRepository {
  abstract getUsers(params: UserQueryParams): Promise<PagedResult<User>>;
  abstract getUserById(id: number): Promise<User>;
  abstract createUser(payload: CreateUserPayload): Promise<User>;
  abstract updateUser(id: number, payload: UpdateUserPayload): Promise<User>;
  abstract toggleUserStatus(id: number, active: boolean): Promise<void>;
  abstract getDepartments(): Promise<Department[]>;
}
```

### Reglas:
- **Clase abstracta**, no interface (necesario para DI de Angular).
- Todos los métodos retornan `Promise<>` (async).
- Solo importa tipos de `@domain/*`.
- Métodos nombrados con verbos: `get`, `create`, `update`, `toggle`, `delete`.
- Operaciones sin retorno (toggle, delete) devuelven `Promise<void>`.

---

## 1.5 Casos de uso

Directorio: `frontend/src/app/domain/usecases/<entity>/`

Un archivo por operación. Cada caso de uso es una clase con un único método `execute()`.

```typescript
// Ejemplo: domain/usecases/user/get-users.usecase.ts
import { Injectable, inject } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';
import { User, UserQueryParams, PagedResult } from '@domain/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class GetUsersUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(params: UserQueryParams): Promise<PagedResult<User>> {
    return this.userRepository.getUsers(params);
  }
}
```

```typescript
// Ejemplo: domain/usecases/user/create-user.usecase.ts
import { Injectable, inject } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';
import { User, CreateUserPayload } from '@domain/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class CreateUserUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(payload: CreateUserPayload): Promise<User> {
    return this.userRepository.createUser(payload);
  }
}
```

```typescript
// Ejemplo: domain/usecases/user/toggle-user-status.usecase.ts
import { Injectable, inject } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';

@Injectable({
  providedIn: 'root',
})
export class ToggleUserStatusUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(id: number, active: boolean): Promise<void> {
    return this.userRepository.toggleUserStatus(id, active);
  }
}
```

### Reglas:
- **1 archivo = 1 caso de uso = 1 operación**.
- Nombre del archivo: `<verb>-<entity>.usecase.ts` (ej: `get-users.usecase.ts`, `create-user.usecase.ts`).
- Clase con `@Injectable({ providedIn: 'root' })` y usa `inject()` para dependencias.
- El método siempre se llama `execute()`.
- Solo delegan al repositorio. Si hay lógica de negocio (validaciones, transformaciones), va aquí, no en el store.

### Naming de archivos:

| Operación | Archivo |
|---|---|
| Listar | `get-<entities>.usecase.ts` |
| Obtener por ID | `get-<entity>-by-id.usecase.ts` |
| Crear | `create-<entity>.usecase.ts` |
| Actualizar | `update-<entity>.usecase.ts` |
| Cambiar estado | `toggle-<entity>-status.usecase.ts` |
| Eliminar | `delete-<entity>.usecase.ts` |

---

## 1.6 Checklist de domain

- [ ] Enum de tipos/roles si la entidad los tiene
- [ ] Modelo principal con todos los campos
- [ ] Interfaces de payloads (Create, Update)
- [ ] Interface de query params para listados
- [ ] `PagedResult<T>` (reutilizar si ya existe)
- [ ] Clases de error tipadas (Validation, Unauthorized, Forbidden, NotFound, ApiError)
- [ ] Clase abstracta de repositorio como contrato
- [ ] Un use case por operación CRUD
- [ ] Cero imports de `@infrastructure/*` o `@features/*`
- [ ] Todos los métodos del repositorio son `async` (Promise)

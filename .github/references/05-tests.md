# Paso 5 — Tests

Tests unitarios con **Vitest** + **Angular TestBed**. Se testean use cases, store y componentes con formularios.

---

## 5.1 Configuración de tests

Framework: **Vitest** (ejecutar con `npm run test` desde `frontend/`)
Imports de Vitest: `import { beforeEach, describe, expect, it, vi } from 'vitest';`
Angular TestBed: `import { TestBed } from '@angular/core/testing';`

---

## 5.2 Tests de Use Cases

Archivo: `frontend/src/app/domain/usecases/<entity>/<entity>.usecases.spec.ts`

Un solo archivo spec para todos los use cases de la entidad.

```typescript
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
import { GetUsersUseCase } from '@domain/usecases/user/get-users.usecase';
import { GetUserByIdUseCase } from '@domain/usecases/user/get-user-by-id.usecase';
import { CreateUserUseCase } from '@domain/usecases/user/create-user.usecase';
import { UpdateUserUseCase } from '@domain/usecases/user/update-user.usecase';
import { ToggleUserStatusUseCase } from '@domain/usecases/user/toggle-user-status.usecase';

// ── Mock data ────────────────────────────────────────────────────────────
const USER_MOCK: User = {
  id: 1,
  firstName: 'Ana',
  lastName: 'Garcia',
  email: 'ana@example.com',
  role: 'Administrator',
  departmentId: 1,
  active: true,
};

// ── Mock repository ──────────────────────────────────────────────────────
class MockUserRepository implements UserRepository {
  getUsers = vi.fn<(params: UserQueryParams) => Promise<PagedResult<User>>>();
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
        // Registrar cada use case como provider
        GetUsersUseCase,
        GetUserByIdUseCase,
        CreateUserUseCase,
        UpdateUserUseCase,
        ToggleUserStatusUseCase,
        // Mock del repositorio
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
      role: 'Administrator',
      departmentId: 1,
    };
    repo.createUser.mockResolvedValueOnce(USER_MOCK);

    const result = await useCase.execute(payload);

    expect(repo.createUser).toHaveBeenCalledWith(payload);
    expect(result).toEqual(USER_MOCK);
  });

  // ... mismo patrón para Update y Toggle
});
```

### Patrón de test de use case:
1. **Mock repository** con `vi.fn()` para cada método.
2. **TestBed** registra use cases + mock repository.
3. Cada test verifica que el use case **delega** la llamada al repositorio.
4. Usa `mockResolvedValueOnce()` para simular respuestas.
5. Verifica: método llamado con args correctos y resultado propagado.

---

## 5.3 Tests del Store

Archivo: `frontend/src/app/features/<feature>/state/<feature>.store.spec.ts`

> **Importante**: Como el store usa `inject()` para los use cases, TestBed debe
> registrar tanto los use cases como el mock repository para que la cadena de
> inyección funcione. Los datos mock deben ser `const` para evitar contaminación entre tests.

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { UsersStore } from '@features/users/state/users.store';
import { AuthService } from '@core/services/auth.service';
import { UserRepository } from '@domain/repositories/user.repository';
import { GetUsersUseCase } from '@domain/usecases/user/get-users.usecase';
import { CreateUserUseCase } from '@domain/usecases/user/create-user.usecase';
import { UpdateUserUseCase } from '@domain/usecases/user/update-user.usecase';
import { ToggleUserStatusUseCase } from '@domain/usecases/user/toggle-user-status.usecase';
import {
  User,
  Department,
  CreateUserPayload,
  UpdateUserPayload,
  UserQueryParams,
  PagedResult,
} from '@domain/models/user.model';
import {
  UserForbiddenError,
  UserValidationError,
} from '@domain/models/user-errors';

// ── Mock data (siempre const, nunca let) ──────────────────────────────
const USER_A: User = {
  id: 1, firstName: 'Ana', lastName: 'Garcia',
  email: 'ana@example.com', role: 'Administrator',
  departmentId: 1, active: true,
};

const USER_B: User = {
  id: 2, firstName: 'Carlos', lastName: 'Martinez',
  email: 'carlos@example.com', role: 'Manager',
  departmentId: 2, active: true,
};

// ── Mock AuthService ──────────────────────────────────────────────────
class MockAuthService {
  readonly user = signal({
    uid: 'uid-1',
    email: 'admin@example.com',
    displayName: 'Admin',
    photoURL: null,
    role: 'Administrator' as const,
  });
}

// ── Mock Repository ───────────────────────────────────────────────────
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
        // Use cases reales — se registran para que inject() los resuelva
        GetUsersUseCase,
        CreateUserUseCase,
        UpdateUserUseCase,
        ToggleUserStatusUseCase,
        // Servicios mock
        { provide: AuthService, useValue: new MockAuthService() },
        { provide: UserRepository, useValue: repo },
      ],
    });

    store = TestBed.inject(UsersStore);
  });

  // ── Load tests ──────────────────────────────────────────────────────
  it('loads users and total successfully', async () => {
    const response: PagedResult<User> = {
      data: [USER_A, USER_B], total: 2, page: 1, pageSize: 20,
    };
    repo.getUsers.mockResolvedValueOnce(response);

    await store.loadUsers();

    expect(store.users()).toEqual([USER_A, USER_B]);
    expect(store.total()).toBe(2);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('sets error when loading fails', async () => {
    repo.getUsers.mockRejectedValueOnce(new Error('boom'));
    await store.loadUsers();
    expect(store.error()).toBe('Failed to load users.');
    expect(store.loading()).toBe(false);
  });

  // ── Error mapping tests ─────────────────────────────────────────────
  it('maps forbidden error to specific message', async () => {
    repo.getUsers.mockRejectedValueOnce(new UserForbiddenError());
    await store.loadUsers();
    expect(store.error()).toBe('You do not have permissions to perform this action.');
  });

  it('maps validation error to backend message', async () => {
    repo.createUser.mockRejectedValueOnce(
      new UserValidationError({ field: 'email' }, 'Email already exists.'),
    );
    await store.saveUser({
      firstName: 'Ana', lastName: 'Garcia', email: 'ana@example.com',
      role: 'Administrator', departmentId: 1,
    });
    expect(store.error()).toBe('Email already exists.');
  });

  // ── CRUD tests ──────────────────────────────────────────────────────
  it('creates a new entity and updates state', async () => {
    const payload: CreateUserPayload = {
      firstName: 'Carlos', lastName: 'Martinez', email: 'carlos@example.com',
      role: 'Manager', departmentId: 2,
    };
    repo.createUser.mockResolvedValueOnce(USER_B);
    store.users.set([USER_A]);
    store.total.set(1);
    store.dialogVisible.set(true);

    await store.saveUser(payload);

    expect(store.users()).toEqual([USER_A, USER_B]);
    expect(store.total()).toBe(2);
    expect(store.dialogVisible()).toBe(false);
  });

  it('updates an existing entity in edit mode', async () => {
    const updated: User = { ...USER_A, lastName: 'Gonzalez' };
    repo.updateUser.mockResolvedValueOnce(updated);
    store.users.set([USER_A]);
    store.selectedUser.set(USER_A);
    store.dialogMode.set('edit');

    await store.saveUser({ lastName: 'Gonzalez' });

    expect(store.users()).toEqual([updated]);
    expect(store.dialogVisible()).toBe(false);
  });

  it('toggles status and closes confirm dialog', async () => {
    repo.toggleUserStatus.mockResolvedValueOnce();
    store.users.set([USER_A]);
    store.userToToggle.set(USER_A);
    store.confirmDialogVisible.set(true);

    await store.confirmToggleStatus();

    expect(store.users()[0].active).toBe(false);
    expect(store.confirmDialogVisible()).toBe(false);
  });

  // ── Filter tests ────────────────────────────────────────────────────
  it('search resets page and triggers load', () => {
    const spy = vi.spyOn(store, 'loadUsers').mockResolvedValue();
    store.page.set(5);
    store.onSearch('ana');
    expect(store.searchQuery()).toBe('ana');
    expect(store.page()).toBe(1);
    expect(spy).toHaveBeenCalledOnce();
  });

  // ── Department tests ────────────────────────────────────────────────
  it('loads departments and stores result', async () => {
    const departments: Department[] = [
      { id: 1, name: 'Tecnologia' },
      { id: 2, name: 'Ventas' },
    ];
    repo.getDepartments.mockResolvedValueOnce(departments);
    await store.loadDepartments();
    expect(store.departments()).toEqual(departments);
  });
});
```

### Qué testear en el store:
| Grupo | Tests |
|---|---|
| **Load** | Carga exitosa actualiza signals, error setea mensaje |
| **Error mapping** | Cada tipo de error domain produce mensaje esperado |
| **Create** | Nuevo item se añade al array, total incrementa, dialog cierra |
| **Update** | Item existente se reemplaza en el array, dialog cierra |
| **Toggle** | Campo `active` cambia, dialog de confirmación cierra |
| **Filtros** | Cambio de filtro resetea página y dispara recarga |
| **Datos auxiliares** | Departments se cargan correctamente |

---

## 5.4 Tests de Form Dialog Component

Archivo: `frontend/src/app/features/<feature>/components/<entity>-form-dialog/<entity>-form-dialog.component.spec.ts`

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { UserFormDialogComponent } from '@features/users/components/user-form-dialog/user-form-dialog.component';
import { UsersStore } from '@features/users/state/users.store';
import { User } from '@domain/models/user.model';

const USER_MOCK: User = {
  id: 10, firstName: 'Elena', lastName: 'Ruiz',
  email: 'elena@example.com', role: 'Administrator',
  departmentId: 2, active: true,
};

// Mock store simplificado con signals
class MockUsersStore {
  readonly selectedUser = signal<User | null>(null);
  readonly dialogMode = signal<'create' | 'edit'>('create');
  readonly departments = signal([
    { id: 1, name: 'Tecnologia' },
    { id: 2, name: 'Ventas' },
  ]);
  readonly saveUser = vi.fn();
  readonly closeDialog = vi.fn();
}

describe('UserFormDialogComponent', () => {
  let store: MockUsersStore;

  beforeEach(async () => {
    store = new MockUsersStore();

    await TestBed.configureTestingModule({
      imports: [UserFormDialogComponent],
      providers: [{ provide: UsersStore, useValue: store }],
    })
      // Override template para evitar dependencias de PrimeNG en tests
      .overrideComponent(UserFormDialogComponent, {
        set: { template: '<div></div>' },
      })
      .compileComponents();
  });

  it('submits create payload when form is valid', () => {
    const fixture = TestBed.createComponent(UserFormDialogComponent);
    const component = fixture.componentInstance;
    store.dialogMode.set('create');
    fixture.detectChanges();

    component.form.setValue({
      firstName: 'Ana', lastName: 'Garcia',
      email: 'ana@example.com', role: 'Manager', departmentId: 1,
    });

    component.onConfirm();

    expect(store.saveUser).toHaveBeenCalledWith({
      firstName: 'Ana', lastName: 'Garcia',
      email: 'ana@example.com', role: 'Manager', departmentId: 1,
    });
  });

  it('submits update payload in edit mode', () => {
    store.dialogMode.set('edit');
    store.selectedUser.set(USER_MOCK);

    const fixture = TestBed.createComponent(UserFormDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      firstName: 'Elena Maria', lastName: 'Ruiz',
      role: 'Administrator', departmentId: 2,
    });

    fixture.componentInstance.onConfirm();

    expect(store.saveUser).toHaveBeenCalledWith({
      firstName: 'Elena Maria', lastName: 'Ruiz',
      role: 'Administrator', departmentId: 2,
    });
  });

  it('does not submit if form is invalid', () => {
    const fixture = TestBed.createComponent(UserFormDialogComponent);
    fixture.detectChanges();
    fixture.componentInstance.form.reset();
    fixture.componentInstance.onConfirm();
    expect(store.saveUser).not.toHaveBeenCalled();
  });

  it('calls closeDialog on cancel', () => {
    const fixture = TestBed.createComponent(UserFormDialogComponent);
    fixture.componentInstance.onCancel();
    expect(store.closeDialog).toHaveBeenCalledOnce();
  });
});
```

### Patrones de tests de componentes:
- **Mock del store** con signals y `vi.fn()` para métodos.
- `overrideComponent` con template vacío para tests que no necesitan render.
- Testear: submit con datos válidos, submit inválido no llama, cancel llama `closeDialog`.

---

## 5.5 Reglas generales de tests

1. **Framework**: Vitest (`vi.fn()`, `vi.spyOn()`, `describe/it/expect`).
2. **TestBed**: para todo lo que usa `inject()`.
3. **Mocks**: clase que implementa la interface/clase abstracta con `vi.fn()`.
4. **Datos mock**: constantes al inicio del archivo (`USER_A`, `USER_B`, etc).
5. **Assertions**: `toHaveBeenCalledWith()`, `toEqual()`, `toBe()`, `toBeNull()`.
6. **Naming**: `it('describe lo que hace', ...)` — en inglés.
7. **Cobertura**: use cases, store (load/CRUD/error/filters), form dialog (submit/cancel/validation).
8. **No testear**: componentes presentacionales triviales (badges), templates HTML.

---

## 5.6 Checklist de tests

- [ ] `<entity>.usecases.spec.ts` — 1 test por use case (delegación a repo)
- [ ] `<feature>.store.spec.ts` — load, error mapping, create, update, toggle, filters
- [ ] `<entity>-form-dialog.component.spec.ts` — submit create, submit edit, invalid, cancel
- [ ] Mocks con `vi.fn()` tipados
- [ ] AuthService mockeado con signal
- [ ] `overrideComponent` si el template tiene dependencias complejas
- [ ] Ejecutar `npm run test` sin errores antes de hacer commit

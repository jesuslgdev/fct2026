# Paso 3 — Feature Store (Signal Store)

El store es el cerebro de la feature. Centraliza todo el estado, computed values, acciones y gestión de errores usando Angular signals.

**Puede depender de**: `@domain/*`, `@core/*`
**NO puede depender de**: `@infrastructure/*` directamente (excepto el repositorio inyectado vía contrato abstracto)

---

## 3.1 Estructura del Store

Archivo: `frontend/src/app/features/<feature>/state/<feature>.store.ts`

```typescript
// Ejemplo real: features/users/state/users.store.ts
import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { User, Department, CreateUserPayload, UpdateUserPayload, UserQueryParams } from '@domain/models/user.model';
import { UserRole } from '@domain/enums/user-role.enum';
import { GetUsersUseCase } from '@domain/usecases/user/get-users.usecase';
import { CreateUserUseCase } from '@domain/usecases/user/create-user.usecase';
import { UpdateUserUseCase } from '@domain/usecases/user/update-user.usecase';
import { ToggleUserStatusUseCase } from '@domain/usecases/user/toggle-user-status.usecase';
import {
  UserApiError,
  UserForbiddenError,
  UserNotFoundError,
  UserUnauthorizedError,
  UserValidationError,
} from '@domain/models/user-errors';

export type DialogMode = 'create' | 'edit';
```

---

## 3.2 Patrón de estado con signals

El store define **signals** para cada pieza de estado y **computed** para valores derivados.

```typescript
@Injectable()
export class UsersStore {
  // ── Inyección ──────────────────────────────────────────────────────────
  private readonly authService = inject(AuthService);

  // Use cases se inyectan con inject() — NUNCA usar new
  private readonly getUsersUseCase = inject(GetUsersUseCase);
  private readonly createUserUseCase = inject(CreateUserUseCase);
  private readonly updateUserUseCase = inject(UpdateUserUseCase);
  private readonly toggleUserStatusUseCase = inject(ToggleUserStatusUseCase);

  // ── State (signals) ────────────────────────────────────────────────────
  readonly users = signal<User[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly departments = signal<Department[]>([]);

  // Filtros
  readonly searchQuery = signal('');
  readonly roleFilter = signal<UserRole | null>(null);
  readonly statusFilter = signal<boolean | null>(null);

  // Estado de diálogos
  readonly selectedUser = signal<User | null>(null);
  readonly dialogVisible = signal(false);
  readonly dialogMode = signal<DialogMode>('create');
  readonly confirmDialogVisible = signal(false);
  readonly userToToggle = signal<User | null>(null);

  // ── Computed ───────────────────────────────────────────────────────────
  readonly canEdit = computed(() => this.authService.user()?.role === 'Administrator');
  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));

  // Vista enriquecida (resuelve nombres de FK)
  readonly usersView = computed(() =>
    this.users().map((user) => ({
      ...user,
      departmentName:
        user.departmentId === null
          ? '-'
          : (this.departments().find((d) => d.id === user.departmentId)?.name ?? '-'),
    })),
  );
```

### Patrón de signals:
| Tipo | Signal | Descripción |
|---|---|---|
| **Datos principales** | `users`, `total`, `departments` | Datos del API |
| **Paginación** | `page`, `pageSize` | Estado de tabla |
| **Loading/Error** | `loading`, `error` | Estado de operaciones async |
| **Filtros** | `searchQuery`, `roleFilter`, `statusFilter` | Filtros aplicados |
| **Diálogos** | `dialogVisible`, `dialogMode`, `selectedUser` | Estado del diálogo CRUD |
| **Confirmación** | `confirmDialogVisible`, `userToToggle` | Estado del diálogo de confirmación |

---

## 3.3 Error mapping (Domain → UI messages)

```typescript
  private resolveErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof UserValidationError) {
      return err.message || 'Please check the submitted data.';
    }
    if (err instanceof UserUnauthorizedError) {
      return 'Your session has expired. Please sign in again.';
    }
    if (err instanceof UserForbiddenError) {
      return 'You do not have permissions to perform this action.';
    }
    if (err instanceof UserNotFoundError) {
      return 'The selected entity no longer exists.';
    }
    if (err instanceof UserApiError) {
      return err.message || fallback;
    }
    return fallback;
  }
```

### Reglas:
- Cada error de dominio tiene un mensaje de UI específico.
- `ValidationError` usa el `message` del backend.
- Siempre hay un `fallback` genérico por operación.

---

## 3.4 Acciones de carga de datos

```typescript
  async loadUsers(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const params: UserQueryParams = {
        page: this.page(),
        pageSize: this.pageSize(),
        search: this.searchQuery() || undefined,
        role: this.roleFilter() ?? undefined,
        active: this.statusFilter() ?? undefined,
      };
      const result = await this.getUsersUseCase.execute(params);
      this.users.set(result.data);
      this.total.set(result.total);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to load data.'));
    } finally {
      this.loading.set(false);
    }
  }

  async loadDepartments(): Promise<void> {
    try {
      // Siempre usar use case, nunca repositorio directo
      const result = await this.getDepartmentsUseCase.execute();
      this.departments.set(result);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to load departments.'));
    }
  }
```

### Patrón async:
1. `loading.set(true)` + `error.set(null)`
2. Ejecutar use case
3. Actualizar signals de datos
4. `catch`: mapear error a mensaje UI
5. `finally`: `loading.set(false)`

---

## 3.5 Acciones de diálogos

```typescript
  // Abrir diálogo de creación
  openCreateDialog(): void {
    this.selectedUser.set(null);
    this.dialogMode.set('create');
    this.dialogVisible.set(true);
  }

  // Abrir diálogo de edición
  openEditDialog(user: User): void {
    this.selectedUser.set(user);
    this.dialogMode.set('edit');
    this.dialogVisible.set(true);
  }

  // Cerrar diálogo
  closeDialog(): void {
    this.dialogVisible.set(false);
    this.selectedUser.set(null);
  }

  // Solicitar confirmación de toggle
  requestToggleStatus(user: User): void {
    this.userToToggle.set(user);
    this.confirmDialogVisible.set(true);
  }

  cancelToggleStatus(): void {
    this.userToToggle.set(null);
    this.confirmDialogVisible.set(false);
  }
```

---

## 3.6 Acciones CRUD

```typescript
  async saveUser(payload: CreateUserPayload | UpdateUserPayload): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      if (this.dialogMode() === 'edit' && this.selectedUser()) {
        // Actualizar: reemplazar en el array local
        const updated = await this.updateUserUseCase.execute(
          this.selectedUser()!.id,
          payload as UpdateUserPayload,
        );
        this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
      } else {
        // Crear: añadir al final del array local
        const created = await this.createUserUseCase.execute(payload as CreateUserPayload);
        this.users.update((list) => [...list, created]);
        this.total.update((t) => t + 1);
      }
      this.closeDialog();
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to save.'));
    } finally {
      this.loading.set(false);
    }
  }

  async confirmToggleStatus(): Promise<void> {
    const user = this.userToToggle();
    if (!user) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const nextActive = !user.active;
      await this.toggleUserStatusUseCase.execute(user.id, nextActive);
      // Actualización optimista local
      this.users.update((list) =>
        list.map((u) => (u.id === user.id ? { ...u, active: nextActive } : u)),
      );
      this.confirmDialogVisible.set(false);
      this.userToToggle.set(null);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to update status.'));
    } finally {
      this.loading.set(false);
    }
  }
```

### Patrón de CRUD local:
- **Create**: `users.update(list => [...list, created])` + incrementar `total`.
- **Update**: `users.update(list => list.map(u => u.id === updated.id ? updated : u))`.
- **Toggle**: mismo que update, pero solo cambia un campo.
- **Delete**: `users.update(list => list.filter(u => u.id !== id))` + decrementar `total`.

---

## 3.7 Filtros y paginación

```typescript
  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.page.set(1);        // Reset a primera página
    this.loadUsers();
  }

  onRoleFilterChange(role: UserRole | null): void {
    this.roleFilter.set(role);
    this.page.set(1);
    this.loadUsers();
  }

  onStatusFilterChange(active: boolean | null): void {
    this.statusFilter.set(active);
    this.page.set(1);
    this.loadUsers();
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.page.set(Math.floor(event.first / event.rows) + 1);
    this.pageSize.set(event.rows);
    this.loadUsers();
  }
```

### Reglas:
- Cualquier cambio de filtro **resetea `page` a 1**.
- Cualquier cambio de filtro **recarga los datos**.
- **`onPageChange` también recarga los datos** después de actualizar page y pageSize.
- `onPageChange` recibe el evento del paginador de PrimeNG (`{first, rows}`).

---

## 3.8 Checklist del store

- [ ] `@Injectable()` sin `providedIn` (se provee a nivel de componente página)
- [ ] Signals para: datos, loading, error, paginación, filtros, diálogos
- [ ] Computed para: permisos (`canEdit`), vistas enriquecidas, totales
- [ ] **Use cases inyectados con `inject()`** (nunca `new`)
- [ ] **NO inyecta repositorios** directamente (todo vía use cases)
- [ ] **Sin código muerto**: no inyectar use cases que no se usan
- [ ] `resolveErrorMessage()` mapea errores de dominio a strings de UI
- [ ] Patrón async: loading → try/catch → finally
- [ ] Filtros resetean paginación
- [ ] **`onPageChange()` llama a `loadEntities()`** después de actualizar page/pageSize
- [ ] Actualización optimista local tras CRUD exitoso
- [ ] `closeDialog()` limpia `selectedUser` y cierra

# Paso 4 — Feature Pages y Components

Las páginas y componentes componen la UI de la feature. Usan el store como intermediario y los componentes shared de UI.

**Puede depender de**: `@domain/*`, `@core/*`, `@shared/*`, `@features/<propia-feature>/*`
**NO puede depender de**: `@infrastructure/*`, otras features directamente

---

## 4.1 Routes

Archivo: `frontend/src/app/features/<feature>/<feature>.routes.ts`

```typescript
// Ejemplo real: features/users/users.routes.ts
import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/users/users.page.component').then(
        (m) => m.UsersPageComponent,
      ),
    title: 'Gestión de usuarios',
  },
];
```

### Registro en app.routes.ts:

```typescript
// En app.routes.ts, dentro del layout protegido
{
  path: '<feature>',
  loadChildren: () =>
    import('@features/<feature>/<feature>.routes').then(m => m.<FEATURE>_ROUTES),
},
```

### Reglas:
- `loadComponent` con dynamic import para lazy loading.
- La constante de rutas se llama `<FEATURE>_ROUTES` (UPPER_SNAKE_CASE).
- `title` en español para el `<title>` del navegador.
- Sin guards adicionales (el guard está en el layout padre `AppShellComponent`).

---

## 4.2 Página principal

Archivo: `frontend/src/app/features/<feature>/pages/<feature>/<feature>.page.component.ts`

La página es el componente orquestador. Provee el store y conecta subcomponentes.

```typescript
// Ejemplo real: features/users/pages/users/users.page.component.ts
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { TableComponent } from '@shared/ui/table/table.component';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { UsersStore } from '@features/users/state/users.store';
import { UserStatusBadgeComponent } from '@features/users/components/user-status-badge/user-status-badge.component';
import { UserFormDialogComponent } from '@features/users/components/user-form-dialog/user-form-dialog.component';
import { USER_ROLES, UserRole } from '@domain/enums/user-role.enum';
import { User } from '@domain/models/user.model';

// Tipos para los selects de filtros
interface StatusOption { label: string; value: boolean | null; }
interface RoleOption   { label: string; value: UserRole | null; }

@Component({
  selector: 'app-users-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [UsersStore],    // ← Store provisto a nivel de componente
  imports: [
    FormsModule,
    Select,
    InputComponent,
    TableComponent,
    ButtonComponent,
    DialogComponent,
    UserStatusBadgeComponent,
    UserFormDialogComponent,
  ],
  templateUrl: './users.page.component.html',
})
export class UsersPageComponent implements OnInit {
  readonly store = inject(UsersStore);

  // Opciones de filtros (con opción "todos" como null)
  readonly roleOptions: RoleOption[] = [
    { label: 'Todos los roles', value: null },
    ...USER_ROLES.map((r) => ({
      label: r === 'Employee' ? 'Empleado' : r === 'Manager' ? 'Gerente' : 'Administrador',
      value: r,
    })),
  ];

  readonly statusOptions: StatusOption[] = [
    { label: 'Todos los estados', value: null },
    { label: 'Activo',       value: true  },
    { label: 'Inactivo',     value: false },
  ];

  ngOnInit(): void {
    this.store.loadUsers();
    this.store.loadDepartments();
  }

  trackById(_: number, user: User): number {
    return user.id;
  }

  // Mapeo de etiquetas (inglés → español)
  getRoleLabel(role: User['role']): string {
    switch (role) {
      case 'Employee': return 'Empleado';
      case 'Manager': return 'Gerente';
      case 'Administrator': return 'Administrador';
      default: return role;
    }
  }
}
```

### Reglas:
- `providers: [UsersStore]` — el store vive y muere con la página.
- `ChangeDetectionStrategy.OnPush` obligatorio.
- `standalone: true` obligatorio.
- `ngOnInit` carga datos iniciales.
- Lógica mínima: solo orquestación, traducciones de labels y opciones de filtros.
- No lógica de negocio en el componente.

---

## 4.3 Template de la página

Archivo: `frontend/src/app/features/<feature>/pages/<feature>/<feature>.page.component.html`

```html
<section class="page">

  <!-- ── Header ─────────────────────────────────────── -->
  <div class="page-header">
    <h1 class="text-style-title">Usuarios</h1>
    @if (store.canEdit()) {
      <ui-button
        label="Nuevo usuario"
        icon="pi pi-plus"
        (clicked)="store.openCreateDialog()"
      />
    }
  </div>

  <!-- Error global -->
  @if (store.error(); as errorMessage) {
    <p class="warning-text" role="alert">{{ errorMessage }}</p>
  }

  <!-- ── Filters ────────────────────────────────────── -->
  <div class="filters-row">
    <ui-input
      type="text"
      placeholder="Buscar por nombre o correo…"
      styleClass="flex-1 min-w-64"
      [ngModel]="store.searchQuery()"
      (valueChange)="store.onSearch($event)"
    />
    <p-select
      [options]="roleOptions"
      optionLabel="label"
      optionValue="value"
      placeholder="Todos los roles"
      class="min-w-40"
      [ngModel]="store.roleFilter()"
      (ngModelChange)="store.onRoleFilterChange($event)"
    />
    <p-select
      [options]="statusOptions"
      optionLabel="label"
      optionValue="value"
      placeholder="Todos los estados"
      class="min-w-44"
      [ngModel]="store.statusFilter()"
      (ngModelChange)="store.onStatusFilterChange($event)"
    />
  </div>

  <!-- ── Table ──────────────────────────────────────── -->
  <ui-table
    [value]="store.usersView()"
    [loading]="store.loading()"
    [paginator]="true"
    [rows]="store.pageSize()"
    [totalRecords]="store.total()"
    [rowsPerPageOptions]="[10, 20, 50]"
    tableClass="ui-table-base ui-table-compact ui-table-bordered"
    dataKey="id"
    (page)="store.onPageChange($event)"
  >
    <ng-template #header>
      <tr>
        <th>Nombre completo</th>
        <th>Correo</th>
        <th>Rol</th>
        <th>Departamento</th>
        <th>Estado</th>
        @if (store.canEdit()) { <th>Acciones</th> }
      </tr>
    </ng-template>

    <ng-template #body let-user>
      <tr>
        <td>{{ user.firstName }} {{ user.lastName }}</td>
        <td>{{ user.email }}</td>
        <td>{{ getRoleLabel(user.role) }}</td>
        <td>{{ user.departmentName }}</td>
        <td><ui-user-status-badge [active]="user.active" /></td>
        @if (store.canEdit()) {
          <td>
            <div>
              <ui-button icon="pi pi-pencil" variant="ghost" size="sm"
                (clicked)="store.openEditDialog(user)" />
              <ui-button
                [icon]="user.active ? 'pi pi-ban' : 'pi pi-check-circle'"
                [variant]="user.active ? 'destructive' : 'secondary'"
                size="sm"
                (clicked)="store.requestToggleStatus(user)" />
            </div>
          </td>
        }
      </tr>
    </ng-template>

    <ng-template #emptymessage>
      <tr>
        <td [attr.colspan]="store.canEdit() ? 6 : 5" class="empty-state">
          No se encontraron usuarios.
        </td>
      </tr>
    </ng-template>
  </ui-table>
</section>

<!-- Diálogo de crear/editar -->
<app-user-form-dialog />

<!-- Diálogo de confirmación -->
<ui-dialog
  [(visible)]="store.confirmDialogVisible"
  [header]="store.userToToggle()?.active ? 'Desactivar usuario' : 'Activar usuario'"
  variant="warning"
  size="sm"
  confirmLabel="Confirm"
  cancelLabel="Cancel"
  [confirmLoading]="store.loading()"
  (confirmed)="store.confirmToggleStatus()"
  (cancelled)="store.cancelToggleStatus()"
>
  @if (store.userToToggle(); as user) {
    <p class="warning-text">
      @if (user.active) {
        ¿Está seguro de que desea desactivar
        <strong>{{ user.firstName }} {{ user.lastName }}</strong>?
      } @else {
        ¿Está seguro de que desea reactivar
        <strong>{{ user.firstName }} {{ user.lastName }}</strong>?
      }
    </p>
  }
</ui-dialog>
```

### Estructura del template:
1. **`<section class="page">`** — wrapper con layout global
2. **`.page-header`** — título + botón de acción principal
3. **Error message** — `@if (store.error(); as msg)`
4. **`.filters-row`** — inputs y selects de filtros
5. **`<ui-table>`** — tabla con templates `#header`, `#body`, `#emptymessage`
6. **Diálogos** — al final, fuera del `<section>`

### Patrones de template:
- `@if` / `@for` / `@switch` — control flow nativo Angular (NO `*ngIf`)
- `store.signal()` — acceso a signals con `()`
- `store.signal(); as alias` — alias para reusar en el bloque
- `[(visible)]` — two-way binding con `model()` del dialog
- `(clicked)` — output event del button component

---

## 4.4 Form Dialog Component

Archivo: `frontend/src/app/features/<feature>/components/<entity>-form-dialog/<entity>-form-dialog.component.ts`

```typescript
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Select } from 'primeng/select';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { UsersStore } from '@features/users/state/users.store';
import { UserRole } from '@domain/enums/user-role.enum';
import { CreateUserPayload, UpdateUserPayload } from '@domain/models/user.model';

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Select, DialogComponent, InputComponent],
  templateUrl: './user-form-dialog.component.html',
})
export class UserFormDialogComponent {
  readonly store = inject(UsersStore);
  private readonly fb = inject(FormBuilder);
  readonly renderSelects = signal(true);

  // Formulario tipado con FormBuilder
  readonly form = this.fb.group({
    firstName:    ['', Validators.required],
    lastName:     ['', Validators.required],
    email:        ['', [Validators.required, Validators.email]],
    role:         [null as UserRole | null, Validators.required],
    departmentId: [null as number | null, Validators.required],
  });

  // Opciones de select
  readonly roleOptions = [
    { label: 'Empleado',      value: 'Employee'      },
    { label: 'Gerente',       value: 'Manager'       },
    { label: 'Administrador', value: 'Administrator' },
  ];

  // Getters para acceso rápido a controles
  get firstName()    { return this.form.controls.firstName;    }
  get lastName()     { return this.form.controls.lastName;     }
  get email()        { return this.form.controls.email;        }
  get role()         { return this.form.controls.role;         }
  get departmentId() { return this.form.controls.departmentId; }

  constructor() {
    // Effect: sincroniza form cuando cambia el modo/usuario seleccionado
    effect(() => {
      const user = this.store.selectedUser();
      const mode = this.store.dialogMode();
      if (mode === 'edit' && user) {
        this.form.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          departmentId: user.departmentId,
        });
        // En edición, email no se modifica
        this.email.clearValidators();
        this.email.updateValueAndValidity();
      } else {
        this.form.reset();
        this.email.setValidators([Validators.required, Validators.email]);
        this.email.updateValueAndValidity();
      }
      // Workaround: forzar remount de p-select para limpiar estado interno
      this.renderSelects.set(false);
      queueMicrotask(() => this.renderSelects.set(true));
    });
  }

  onConfirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();

    if (this.store.dialogMode() === 'create') {
      const payload: CreateUserPayload = {
        firstName: v.firstName!,
        lastName: v.lastName!,
        email: v.email!,
        role: v.role!,
        departmentId: v.departmentId!,
      };
      this.store.saveUser(payload);
    } else {
      const payload: UpdateUserPayload = {
        firstName: v.firstName ?? undefined,
        lastName: v.lastName ?? undefined,
        role: v.role ?? undefined,
        departmentId: v.departmentId ?? undefined,
      };
      this.store.saveUser(payload);
    }
  }

  onCancel(): void {
    this.store.closeDialog();
  }
}
```

### Template del form dialog:

```html
<ui-dialog
  [(visible)]="store.dialogVisible"
  [header]="store.dialogMode() === 'create' ? 'Nuevo usuario' : 'Editar usuario'"
  confirmLabel="Guardar"
  cancelLabel="Cancelar"
  [confirmLoading]="store.loading()"
  [confirmDisabled]="form.invalid"
  (confirmed)="onConfirm()"
  (cancelled)="onCancel()"
>
  <form [formGroup]="form" class="dialog-form">
    <!-- Grid de 2 columnas -->
    <div class="dialog-form-grid">
      <label class="dialog-field">
        <span class="dialog-field-label">Nombre</span>
        <ui-input formControlName="firstName" placeholder="Nombre"
          [state]="firstName.invalid && firstName.touched ? 'error' : 'default'" />
        @if (firstName.invalid && firstName.touched) {
          <span class="dialog-field-error">El nombre es obligatorio.</span>
        }
      </label>
      <label class="dialog-field">
        <span class="dialog-field-label">Apellidos</span>
        <ui-input formControlName="lastName" placeholder="Apellidos"
          [state]="lastName.invalid && lastName.touched ? 'error' : 'default'" />
        @if (lastName.invalid && lastName.touched) {
          <span class="dialog-field-error">Los apellidos son obligatorios.</span>
        }
      </label>
    </div>

    <!-- Campo condicional (solo en creación) -->
    @if (store.dialogMode() === 'create') {
      <label class="dialog-field">
        <span class="dialog-field-label">Correo electrónico</span>
        <ui-input formControlName="email" type="email"
          placeholder="usuario@empresa.com"
          [state]="email.invalid && email.touched ? 'error' : 'default'" />
        @if (email.invalid && email.touched) {
          <span class="dialog-field-error">
            @if (email.hasError('required')) { El correo es obligatorio. }
            @else { Introduce un correo electrónico válido. }
          </span>
        }
      </label>
    }

    <!-- Select con @if renderSelects para workaround -->
    <div class="dialog-field">
      <span class="dialog-field-label">Rol</span>
      @if (renderSelects()) {
        <p-select formControlName="role" [options]="roleOptions"
          optionLabel="label" optionValue="value"
          placeholder="Selecciona un rol" styleClass="w-full" appendTo="body" />
      }
      @if (role.invalid && role.touched) {
        <span class="dialog-field-error">El rol es obligatorio.</span>
      }
    </div>

    <!-- Select con datos del store -->
    <div class="dialog-field">
      <span class="dialog-field-label">Departamento</span>
      @if (renderSelects()) {
        <p-select formControlName="departmentId" [options]="store.departments()"
          optionLabel="name" optionValue="id"
          placeholder="Selecciona un departamento" styleClass="w-full" appendTo="body" />
      }
      @if (departmentId.invalid && departmentId.touched) {
        <span class="dialog-field-error">El departamento es obligatorio.</span>
      }
    </div>
  </form>
</ui-dialog>
```

### Patrones del form dialog:
- `effect()` sincroniza formulario cuando cambia el modo o usuario seleccionado.
- En modo **edit**, desactiva validación de campos no editables (como email).
- `renderSelects` signal: workaround para forzar remount de PrimeNG selects.
- `markAllAsTouched()` muestra errores si el form es inválido.
- `getRawValue()` obtiene todos los valores incluyendo disabled.

---

## 4.5 Status Badge Component

Componente presentacional que muestra el estado con un badge coloreado.

```typescript
// features/users/components/user-status-badge/user-status-badge.component.ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent } from '@shared/ui/badge/badge.component';

@Component({
  selector: 'ui-user-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent],
  template: `
    <ui-badge [label]="label()" [variant]="variant()" />
  `,
})
export class UserStatusBadgeComponent {
  active = input.required<boolean>();

  readonly label = computed(() => (this.active() ? 'Activo' : 'Inactivo'));
  readonly variant = computed(() => (this.active() ? 'success' as const : 'danger' as const));
}
```

### Reglas de componentes presentacionales:
- Solo `input()` y `output()` — sin servicios de negocio.
- `ChangeDetectionStrategy.OnPush`.
- Computed para derivar valores del input.
- Template inline si es pequeño.

---

## 4.6 Checklist de pages/components

- [ ] Routes con `loadComponent` y lazy loading
- [ ] Ruta registrada en `app.routes.ts`
- [ ] Página con `providers: [Store]`, `OnPush`, `standalone`
- [ ] `ngOnInit` carga datos iniciales
- [ ] Template usa clases globales: `.page`, `.page-header`, `.filters-row`, `.empty-state`
- [ ] Template usa control flow nativo: `@if`, `@for`
- [ ] Componentes shared UI: `ui-button`, `ui-input`, `ui-table`, `ui-dialog`, `ui-badge`
- [ ] Form dialog con `ReactiveFormsModule`, `FormBuilder`, `Validators`
- [ ] Effect sincroniza form con modo/entidad seleccionada
- [ ] Componentes presentacionales sin lógica de negocio
- [ ] Campos condicionales por modo (`@if dialogMode === 'create'`)
- [ ] Validación con `markAllAsTouched()`, mensajes de error inline

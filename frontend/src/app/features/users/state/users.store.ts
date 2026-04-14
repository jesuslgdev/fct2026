import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, EMPTY, finalize, tap, take } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  UserQueryParams,
} from '@domain/models/user.model';
import { Department } from '@domain/models/department.model';
import { UserRole } from '@domain/enums/user-role.enum';
import { GetUsersUseCase } from '@domain/usecases/user/get-users.usecase';
import { CreateUserUseCase } from '@domain/usecases/user/create-user.usecase';
import { UpdateUserUseCase } from '@domain/usecases/user/update-user.usecase';
import { ActivateUserUseCase } from '@domain/usecases/user/activate-user.usecase';
import { DeactivateUserUseCase } from '@domain/usecases/user/deactivate-user.usecase';
import { DeleteUserUseCase } from '@domain/usecases/user/delete-user.usecase';
import { GetDepartmentsForUsersUseCase } from '@domain/usecases/departments/get-departments-for-users.usecase';
import {
  UserAlreadyActiveError,
  UserAlreadyExistsError,
  UserAlreadyInactiveError,
  UserApiError,
  UserDeletedError,
  UserForbiddenError,
  UserNotFoundError,
  UserUnauthorizedError,
  UserValidationError,
} from '@domain/models/user-errors';

export type DialogMode = 'create' | 'edit';
type UserView = User & {
  departmentName: string;
  fullName: string;
  emailDisplay: string;
  pendingFirstLogin: boolean;
};

@Injectable()
export class UsersStore {
  private readonly authService = inject(AuthService);
  private readonly getDepartmentsUseCase = inject(GetDepartmentsForUsersUseCase);

  private readonly getUsersUseCase = inject(GetUsersUseCase);
  private readonly createUserUseCase = inject(CreateUserUseCase);
  private readonly updateUserUseCase = inject(UpdateUserUseCase);
  private readonly activateUserUseCase = inject(ActivateUserUseCase);
  private readonly deactivateUserUseCase = inject(DeactivateUserUseCase);
  private readonly deleteUserUseCase = inject(DeleteUserUseCase);

  readonly users = signal<User[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly departments = signal<Department[]>([]);
  readonly searchQuery = signal('');
  readonly roleFilter = signal<UserRole | null>(null);
  readonly statusFilter = signal<boolean | null>(null);
  readonly selectedUser = signal<User | null>(null);
  readonly dialogVisible = signal(false);
  readonly dialogMode = signal<DialogMode>('create');
  readonly dialogError = signal<string | null>(null);
  readonly confirmDialogVisible = signal(false);
  readonly userToToggle = signal<User | null>(null);
  readonly deleteDialogVisible = signal(false);
  readonly userToDelete = signal<User | null>(null);

  readonly canEdit = this.authService.isAdmin;
  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));
  readonly usersView = computed<UserView[]>(() =>
    this.users().map((user) => ({
      ...user,
      fullName: `${user.firstName} ${user.lastName ?? ''}`.trim(),
      emailDisplay: user.email ?? '-',
      pendingFirstLogin: user.lastLoginAt == null,
      departmentName:
        user.departmentId === null
          ? '-'
          : (this.departments().find((d) => d.id === user.departmentId)?.name ?? '-'),
    })),
  );

  private resolveErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof UserAlreadyExistsError) {
      return 'Ya existe un usuario con este correo electronico.';
    }

    if (err instanceof UserAlreadyActiveError) {
      return 'El usuario ya esta activo.';
    }

    if (err instanceof UserAlreadyInactiveError) {
      return 'El usuario ya esta inactivo.';
    }

    if (err instanceof UserDeletedError) {
      return 'El usuario ha sido eliminado y no se puede modificar.';
    }

    if (err instanceof UserValidationError) {
      return err.message || 'Revisa los datos introducidos.';
    }

    if (err instanceof UserUnauthorizedError) {
      return 'Tu sesion ha expirado. Vuelve a iniciar sesion.';
    }

    if (err instanceof UserForbiddenError) {
      return 'No tienes permisos para realizar esta accion.';
    }

    if (err instanceof UserNotFoundError) {
      return 'El usuario seleccionado ya no existe.';
    }

    if (err instanceof UserApiError) {
      return err.message || fallback;
    }

    return fallback;
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: UserQueryParams = {
      page: this.page(),
      pageSize: this.pageSize(),
      search: this.searchQuery() || undefined,
      role: this.roleFilter() ?? undefined,
      active: this.statusFilter() ?? undefined,
    };

    this.getUsersUseCase
      .execute(params)
      .pipe(
        take(1),
        tap((result) => {
          this.users.set(result.data);
          this.total.set(result.total);
        }),
        catchError((err) => {
          this.error.set(this.resolveErrorMessage(err, 'No se pudieron cargar los usuarios.'));
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  loadDepartments(): void {
    this.getDepartmentsUseCase
      .execute()
      .pipe(
        take(1),
        tap((result) => this.departments.set(result)),
        catchError((err) => {
          this.error.set(this.resolveErrorMessage(err, 'No se pudieron cargar los departamentos.'));
          return EMPTY;
        }),
      )
      .subscribe();
  }

  openCreateDialog(): void {
    this.selectedUser.set(null);
    this.dialogMode.set('create');
    this.dialogError.set(null);
    this.dialogVisible.set(true);
  }

  openEditDialog(user: User): void {
    this.selectedUser.set(user);
    this.dialogMode.set('edit');
    this.dialogError.set(null);
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.selectedUser.set(null);
    this.dialogError.set(null);
  }

  requestToggleStatus(user: User): void {
    this.error.set(null);
    this.userToToggle.set(user);
    this.confirmDialogVisible.set(true);
  }

  cancelToggleStatus(): void {
    this.userToToggle.set(null);
    this.confirmDialogVisible.set(false);
  }

  requestDeleteUser(user: User): void {
    this.error.set(null);
    this.userToDelete.set(user);
    this.deleteDialogVisible.set(true);
  }

  cancelDeleteUser(): void {
    this.userToDelete.set(null);
    this.deleteDialogVisible.set(false);
  }

  saveUser(payload: CreateUserPayload | UpdateUserPayload): void {
    this.loading.set(true);
    this.dialogError.set(null);

    const request$ =
      this.dialogMode() === 'edit' && this.selectedUser()
        ? this.updateUserUseCase.execute(this.selectedUser()!.id, payload as UpdateUserPayload).pipe(
            tap((updated) => {
              this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
              this.closeDialog();
            }),
          )
        : this.createUserUseCase.execute(payload as CreateUserPayload).pipe(
            tap((created) => {
              this.users.update((list) => [...list, created]);
              this.total.update((t) => t + 1);
              this.closeDialog();
            }),
          );

    request$
      .pipe(
        take(1),
        catchError((err) => {
          this.dialogError.set(this.resolveErrorMessage(err, 'No se pudo guardar el usuario.'));
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  confirmToggleStatus(): void {
    const user = this.userToToggle();
    if (!user) return;

    this.loading.set(true);
    this.error.set(null);

    const request$ = user.active
      ? this.deactivateUserUseCase.execute(user.id)
      : this.activateUserUseCase.execute(user.id);

    request$
      .pipe(
        take(1),
        tap(() => {
          this.confirmDialogVisible.set(false);
          this.userToToggle.set(null);
          this.loadUsers();
        }),
        catchError((err) => {
          this.error.set(
            this.resolveErrorMessage(
              err,
              user.active
                ? 'No se pudo desactivar el usuario.'
                : 'No se pudo activar el usuario.',
            ),
          );
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  confirmDeleteUser(): void {
    const user = this.userToDelete();
    if (!user) return;

    this.loading.set(true);
    this.error.set(null);

    this.deleteUserUseCase
      .execute(user.id)
      .pipe(
        take(1),
        tap(() => {
          this.deleteDialogVisible.set(false);
          this.userToDelete.set(null);
          this.loadUsers();
        }),
        catchError((err) => {
          this.error.set(this.resolveErrorMessage(err, 'No se pudo eliminar el usuario.'));
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.page.set(1);
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
}

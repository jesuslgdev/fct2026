import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { User, CreateUserPayload, UpdateUserPayload, UserQueryParams } from '@domain/models/user.model';
import { Department } from '@domain/models/department.model';
import { UserRole } from '@domain/enums/user-role.enum';
import { GetUsersUseCase } from '@domain/usecases/user/get-users.usecase';
import { CreateUserUseCase } from '@domain/usecases/user/create-user.usecase';
import { UpdateUserUseCase } from '@domain/usecases/user/update-user.usecase';
import { ToggleUserStatusUseCase } from '@domain/usecases/user/toggle-user-status.usecase';
import { GetDepartmentsForUsersUseCase } from '@domain/usecases/departments/get-departments-for-users.usecase';
import {
  UserApiError,
  UserForbiddenError,
  UserNotFoundError,
  UserUnauthorizedError,
  UserValidationError,
} from '@domain/models/user-errors';

export type DialogMode = 'create' | 'edit';
type UserView = User & { departmentName: string };

@Injectable()
export class UsersStore {
  private readonly authService = inject(AuthService);
  private readonly getDepartmentsUseCase = inject(GetDepartmentsForUsersUseCase);

  private readonly getUsersUseCase = inject(GetUsersUseCase);
  private readonly createUserUseCase = inject(CreateUserUseCase);
  private readonly updateUserUseCase = inject(UpdateUserUseCase);
  private readonly toggleUserStatusUseCase = inject(ToggleUserStatusUseCase);

  // ── State ──────────────────────────────────────────────────────────────────
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
  readonly confirmDialogVisible = signal(false);
  readonly userToToggle = signal<User | null>(null);

  // ── Computed ───────────────────────────────────────────────────────────────
  readonly canEdit = this.authService.isAdmin;
  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));
  readonly usersView = computed<UserView[]>(() =>
    this.users().map((user) => ({
      ...user,
      departmentName:
        user.departmentId === null
          ? '-'
          : (this.departments().find((d) => d.id === user.departmentId)?.name ?? '-'),
    })),
  );

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
      return 'The selected user no longer exists.';
    }

    if (err instanceof UserApiError) {
      return err.message || fallback;
    }

    return fallback;
  }

  // ── Data loading ───────────────────────────────────────────────────────────
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
      this.error.set(this.resolveErrorMessage(err, 'Failed to load users.'));
    } finally {
      this.loading.set(false);
    }
  }

  async loadDepartments(): Promise<void> {
    try {
      const result = await this.getDepartmentsUseCase.execute();
      this.departments.set(result);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to load departments.'));
    }
  }

  // ── Dialog ─────────────────────────────────────────────────────────────────
  openCreateDialog(): void {
    this.selectedUser.set(null);
    this.dialogMode.set('create');
    this.dialogVisible.set(true);
  }

  openEditDialog(user: User): void {
    this.selectedUser.set(user);
    this.dialogMode.set('edit');
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.selectedUser.set(null);
  }

  // ── Confirm deactivate dialog ───────────────────────────────────────────────
  requestToggleStatus(user: User): void {
    this.userToToggle.set(user);
    this.confirmDialogVisible.set(true);
  }

  cancelToggleStatus(): void {
    this.userToToggle.set(null);
    this.confirmDialogVisible.set(false);
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────
  async saveUser(payload: CreateUserPayload | UpdateUserPayload): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      if (this.dialogMode() === 'edit' && this.selectedUser()) {
        const updated = await this.updateUserUseCase.execute(
          this.selectedUser()!.id,
          payload as UpdateUserPayload,
        );
        this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
      } else {
        const created = await this.createUserUseCase.execute(payload as CreateUserPayload);
        this.users.update((list) => [...list, created]);
        this.total.update((t) => t + 1);
      }
      this.closeDialog();
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to save user.'));
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
      this.users.update((list) =>
        list.map((u) => (u.id === user.id ? { ...u, active: nextActive } : u)),
      );
      this.confirmDialogVisible.set(false);
      this.userToToggle.set(null);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to update user status.'));
    } finally {
      this.loading.set(false);
    }
  }

  // ── Filters & pagination ───────────────────────────────────────────────────
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

  }
}

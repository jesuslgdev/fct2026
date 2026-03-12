import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { User, Department, CreateUserPayload, UpdateUserPayload, UserQueryParams } from '@domain/models/user.model';
import { UserRole } from '@domain/enums/user-role.enum';
import { GetUsersUseCase } from '@domain/usecases/user/get-users.usecase';
import { GetUserByIdUseCase } from '@domain/usecases/user/get-user-by-id.usecase';
import { CreateUserUseCase } from '@domain/usecases/user/create-user.usecase';
import { UpdateUserUseCase } from '@domain/usecases/user/update-user.usecase';
import { ToggleUserStatusUseCase } from '@domain/usecases/user/toggle-user-status.usecase';
import { UserRepository } from '@domain/repositories/user.repository';

export type DialogMode = 'create' | 'edit';

@Injectable()
export class UsersStore {
  private readonly authService = inject(AuthService);
  private readonly userRepository = inject(UserRepository);

  private readonly getUsersUseCase = new GetUsersUseCase();
  private readonly getUserByIdUseCase = new GetUserByIdUseCase();
  private readonly createUserUseCase = new CreateUserUseCase();
  private readonly updateUserUseCase = new UpdateUserUseCase();
  private readonly toggleUserStatusUseCase = new ToggleUserStatusUseCase();

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
  readonly canEdit = computed(() => this.authService.user()?.role === 'Administrator');
  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));

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
    } catch {
      this.error.set('Failed to load users.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadDepartments(): Promise<void> {
    try {
      const result = await this.userRepository.getDepartments();
      this.departments.set(result);
    } catch {
      this.error.set('Failed to load departments.');
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
    } catch {
      this.error.set('Failed to save user.');
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
    } catch {
      this.error.set('Failed to update user status.');
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
    this.loadUsers();
  }
}

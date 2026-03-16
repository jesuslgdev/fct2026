import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import {
  Client,
  CreateClientPayload,
  UpdateClientPayload,
  ClientQueryParams,
} from '@domain/models/client.model';
import { GetClientsUseCase } from '@domain/usecases/client/get-clients.usecase';
import { CreateClientUseCase } from '@domain/usecases/client/create-client.usecase';
import { UpdateClientUseCase } from '@domain/usecases/client/update-client.usecase';
import { ToggleClientStatusUseCase } from '@domain/usecases/client/toggle-client-status.usecase';
import { GetClientByIdUseCase } from '@domain/usecases/client/get-client-by-id.usecase';
import {
  ClientApiError,
  ClientForbiddenError,
  ClientNotFoundError,
  ClientUnauthorizedError,
  ClientValidationError,
} from '@domain/models/client-errors';

export type DialogMode = 'create' | 'edit' | 'view';

@Injectable()
export class ClientsStore {
  private readonly authService = inject(AuthService);
  private readonly getClientsUseCase = inject(GetClientsUseCase);
  private readonly createClientUseCase = inject(CreateClientUseCase);
  private readonly updateClientUseCase = inject(UpdateClientUseCase);
  private readonly toggleClientStatusUseCase = inject(ToggleClientStatusUseCase);
  private readonly getClientByIdUseCase = inject(GetClientByIdUseCase);

  readonly clients = signal<Client[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly statusFilter = signal<boolean | null>(null);
  readonly selectedClient = signal<Client | null>(null);
  readonly dialogVisible = signal(false);
  readonly dialogMode = signal<DialogMode>('create');
  readonly confirmDialogVisible = signal(false);
  readonly clientToToggle = signal<Client | null>(null);

  readonly canEdit = computed(() => {
    const user = this.authService.user();
    return user?.role === 'Administrator' || user?.role === 'Sales Manager';
  });

  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));

  private resolveErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof ClientValidationError) {
      return err.message || 'Please check the submitted data.';
    }

    if (err instanceof ClientUnauthorizedError) {
      return 'Your session has expired. Please sign in again.';
    }

    if (err instanceof ClientForbiddenError) {
      return 'You do not have permissions to perform this action.';
    }

    if (err instanceof ClientNotFoundError) {
      return 'The selected client no longer exists.';
    }

    if (err instanceof ClientApiError) {
      return err.message || fallback;
    }

    return fallback;
  }

  async loadClients(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const params: ClientQueryParams = {
        page: this.page(),
        pageSize: this.pageSize(),
        search: this.searchQuery() || undefined,
        isActive: this.statusFilter() ?? undefined,
      };
      const result = await this.getClientsUseCase.execute(params);
      this.clients.set(result.data);
      this.total.set(result.total);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to load clients.'));
    } finally {
      this.loading.set(false);
    }
  }

  async loadClientById(id: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const client = await this.getClientByIdUseCase.execute(id);
      this.selectedClient.set(client);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to load client.'));
    } finally {
      this.loading.set(false);
    }
  }

  openCreateDialog(): void {
    this.selectedClient.set(null);
    this.dialogMode.set('create');
    this.dialogVisible.set(true);
  }

  openEditDialog(client: Client): void {
    this.loadClientForEdit(client.clientId);
  }

  private async loadClientForEdit(clientId: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const clientData = await this.getClientByIdUseCase.execute(clientId);
      this.selectedClient.set(clientData);
      this.dialogMode.set('edit');
      this.dialogVisible.set(true);
    } catch (err) {
      this.error.set('Error al cargar los datos del cliente');
      console.error('Error loading client for edit:', err);
    } finally {
      this.loading.set(false);
    }
  }

  openViewDialog(client: Client): void {
    this.loadClientForView(client.clientId);
  }

  private async loadClientForView(clientId: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const clientData = await this.getClientByIdUseCase.execute(clientId);
      this.selectedClient.set(clientData);
      this.dialogMode.set('view');
      this.dialogVisible.set(true);
    } catch (err) {
      this.error.set('Error al cargar los datos del cliente');
      console.error('Error loading client for view:', err);
    } finally {
      this.loading.set(false);
    }
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.selectedClient.set(null);
  }

  requestToggleStatus(client: Client): void {
    this.clientToToggle.set(client);
    this.confirmDialogVisible.set(true);
  }

  cancelToggleStatus(): void {
    this.clientToToggle.set(null);
    this.confirmDialogVisible.set(false);
  }

  async saveClient(payload: CreateClientPayload | UpdateClientPayload): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      if (this.dialogMode() === 'edit' && this.selectedClient()) {
        const updated = await this.updateClientUseCase.execute(
          this.selectedClient()!.clientId,
          payload as UpdateClientPayload,
        );
        this.clients.update((list) =>
          list.map((c) => (c.clientId === updated.clientId ? updated : c)),
        );
      } else {
        const created = await this.createClientUseCase.execute(payload as CreateClientPayload);
        this.clients.update((list) => [...list, created]);
        this.total.update((t) => t + 1);
      }
      this.closeDialog();
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to save client.'));
    } finally {
      this.loading.set(false);
    }
  }

  async confirmToggleStatus(): Promise<void> {
    const client = this.clientToToggle();
    if (!client) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const nextActive = !client.isActive;
      await this.toggleClientStatusUseCase.execute(client.clientId, nextActive);
      this.clients.update((list) =>
        list.map((c) => (c.clientId === client.clientId ? { ...c, isActive: nextActive } : c)),
      );
      this.confirmDialogVisible.set(false);
      this.clientToToggle.set(null);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to update client status.'));
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.page.set(1);
    this.loadClients();
  }

  onStatusFilterChange(active: boolean | null): void {
    this.statusFilter.set(active);
    this.page.set(1);
    this.loadClients();
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.page.set(Math.floor(event.first / event.rows) + 1);
    this.pageSize.set(event.rows);
    this.loadClients();
  }
}

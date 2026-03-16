import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ClientsStore } from './clients.store';
import { AuthService } from '@core/services/auth.service';
import { ClientRepository } from '@domain/repositories/client.repository';
import {
  Client,
  CreateClientPayload,
  UpdateClientPayload,
  ClientQueryParams,
  PagedResult,
} from '@domain/models/client.model';
import {
  ClientForbiddenError,
  ClientValidationError,
  ClientUnauthorizedError,
  ClientNotFoundError,
  ClientApiError,
} from '@domain/models/client-errors';

const CLIENT_A: Client = {
  clientId: 1,
  name: 'Acme Corp',
  taxId: '12345678A',
  address: 'Calle Mayor 1',
  city: 'Madrid',
  province: 'Madrid',
  postalCode: '28001',
  phone: '600000001',
  email: 'acme@example.com',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const CLIENT_B: Client = {
  clientId: 2,
  name: 'Beta SL',
  taxId: '87654321B',
  address: 'Avenida Diagonal 2',
  city: 'Barcelona',
  province: 'Barcelona',
  postalCode: '08001',
  phone: '600000002',
  email: 'beta@example.com',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

class MockAuthService {
  readonly user = signal({
    uid: 'uid-1',
    email: 'admin@example.com',
    displayName: 'Admin',
    photoURL: null,
    role: 'Administrator',
  });
}

class MockClientRepository implements ClientRepository {
  getClients = vi.fn<(params: ClientQueryParams) => Promise<PagedResult<Client>>>();
  getClientById = vi.fn<(id: number) => Promise<Client>>();
  createClient = vi.fn<(payload: CreateClientPayload) => Promise<Client>>();
  updateClient = vi.fn<(id: number, payload: UpdateClientPayload) => Promise<Client>>();
  toggleClientStatus = vi.fn<(id: number, isActive: boolean) => Promise<void>>();
}

describe('ClientsStore', () => {
  let store: ClientsStore;
  let repo: MockClientRepository;

  beforeEach(() => {
    repo = new MockClientRepository();

    TestBed.configureTestingModule({
      providers: [
        ClientsStore,
        { provide: AuthService, useValue: new MockAuthService() },
        { provide: ClientRepository, useValue: repo },
      ],
    });

    store = TestBed.inject(ClientsStore);
  });

  it('loads clients and total successfully', async () => {
    const response: PagedResult<Client> = {
      data: [CLIENT_A, CLIENT_B],
      total: 2,
      page: 1,
      pageSize: 20,
    };
    repo.getClients.mockResolvedValueOnce(response);

    await store.loadClients();

    expect(repo.getClients).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      search: undefined,
      isActive: undefined,
    });
    expect(store.clients()).toEqual([CLIENT_A, CLIENT_B]);
    expect(store.total()).toBe(2);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('sets error when loading clients fails', async () => {
    repo.getClients.mockRejectedValueOnce(new Error('boom'));

    await store.loadClients();

    expect(store.error()).toBe('Failed to load clients.');
    expect(store.loading()).toBe(false);
  });

  it('maps forbidden clients error to a specific message', async () => {
    repo.getClients.mockRejectedValueOnce(new ClientForbiddenError());

    await store.loadClients();

    expect(store.error()).toBe('You do not have permissions to perform this action.');
  });

  it('maps validation clients error to backend message', async () => {
    repo.createClient.mockRejectedValueOnce(
      new ClientValidationError({ field: 'taxId' }, 'Tax ID already exists.'),
    );

    await store.saveClient({
      name: 'Test Client',
      taxId: '12345678A',
      address: 'Test Address',
      city: 'Test City',
      province: 'Test Province',
      postalCode: '12345',
      phone: '123456789',
      email: 'test@example.com',
    });

    expect(store.error()).toBe('Failed to save client.');
  });

  it('creates a new client and updates state', async () => {
    const payload: CreateClientPayload = {
      name: 'Beta SL',
      taxId: '87654321B',
      address: 'Avenida Diagonal 2',
      city: 'Barcelona',
      province: 'Barcelona',
      postalCode: '08001',
      phone: '600000002',
      email: 'beta@example.com',
    };
    repo.createClient.mockResolvedValueOnce(CLIENT_B);

    store.clients.set([CLIENT_A]);
    store.total.set(1);
    store.dialogVisible.set(true);

    await store.saveClient(payload);

    expect(repo.createClient).toHaveBeenCalledWith(payload);
    expect(store.clients()).toEqual([CLIENT_A, CLIENT_B]);
    expect(store.total()).toBe(2);
    expect(store.dialogVisible()).toBe(false);
    expect(store.selectedClient()).toBeNull();
  });

  it('updates an existing client in edit mode', async () => {
    const updated: Client = { ...CLIENT_A, name: 'Acme Corporation' };
    const payload: UpdateClientPayload = { name: 'Acme Corporation' };
    repo.updateClient.mockResolvedValueOnce(updated);

    store.clients.set([CLIENT_A]);
    store.selectedClient.set(CLIENT_A);
    store.dialogMode.set('edit');

    await store.saveClient(payload);

    expect(repo.updateClient).toHaveBeenCalledWith(CLIENT_A.clientId, payload);
    expect(store.clients()).toEqual([updated]);
    expect(store.dialogVisible()).toBe(false);
  });

  it('toggles status and closes confirm dialog', async () => {
    repo.toggleClientStatus.mockResolvedValueOnce();

    store.clients.set([CLIENT_A]);
    store.clientToToggle.set(CLIENT_A);
    store.confirmDialogVisible.set(true);

    await store.confirmToggleStatus();

    expect(repo.toggleClientStatus).toHaveBeenCalledWith(CLIENT_A.clientId, false);
    expect(store.clients()[0].isActive).toBe(false);
    expect(store.confirmDialogVisible()).toBe(false);
    expect(store.clientToToggle()).toBeNull();
  });

  it('loads client by ID successfully', async () => {
    repo.getClientById.mockResolvedValueOnce(CLIENT_A);

    await store.loadClientById(1);

    expect(repo.getClientById).toHaveBeenCalledWith(1);
    expect(store.selectedClient()).toEqual(CLIENT_A);
    expect(store.loading()).toBe(false);
  });

  it('sets error when loading client by ID fails', async () => {
    repo.getClientById.mockRejectedValueOnce(new Error('not found'));

    await store.loadClientById(1);

    expect(store.error()).toBe('The selected client no longer exists.');
    expect(store.loading()).toBe(false);
  });

  it('search resets page and triggers load', () => {
    const spy = vi.spyOn(store, 'loadClients').mockResolvedValue();
    store.page.set(5);

    store.onSearch('acme');

    expect(store.searchQuery()).toBe('acme');
    expect(store.page()).toBe(1);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('status filter change resets page and triggers load', () => {
    const spy = vi.spyOn(store, 'loadClients').mockResolvedValue();
    store.page.set(3);

    store.onStatusFilterChange(false);

    expect(store.statusFilter()).toBe(false);
    expect(store.page()).toBe(1);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('page change triggers load with new parameters', () => {
    const spy = vi.spyOn(store, 'loadClients').mockResolvedValue();

    store.onPageChange({ first: 20, rows: 10 });

    expect(store.page()).toBe(3);
    expect(store.pageSize()).toBe(10);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('open create dialog sets correct state', () => {
    store.selectedClient.set(CLIENT_A);
    store.dialogMode.set('edit');

    store.openCreateDialog();

    expect(store.selectedClient()).toBeNull();
    expect(store.dialogMode()).toBe('create');
    expect(store.dialogVisible()).toBe(true);
  });

  it('open edit dialog sets correct state', () => {
    store.openEditDialog(CLIENT_A);

    expect(store.selectedClient()).toEqual(CLIENT_A);
    expect(store.dialogMode()).toBe('edit');
    expect(store.dialogVisible()).toBe(true);
  });

  it('close dialog resets state', () => {
    store.selectedClient.set(CLIENT_A);
    store.dialogVisible.set(true);

    store.closeDialog();

    expect(store.dialogVisible()).toBe(false);
    expect(store.selectedClient()).toBeNull();
  });

  it('request toggle status sets confirm dialog', () => {
    store.requestToggleStatus(CLIENT_A);

    expect(store.clientToToggle()).toEqual(CLIENT_A);
    expect(store.confirmDialogVisible()).toBe(true);
  });

  it('cancel toggle status resets confirm dialog', () => {
    store.clientToToggle.set(CLIENT_A);
    store.confirmDialogVisible.set(true);

    store.cancelToggleStatus();

    expect(store.confirmDialogVisible()).toBe(false);
    expect(store.clientToToggle()).toBeNull();
  });

  it('canEdit returns true for Administrator', () => {
    expect(store.canEdit()).toBe(true);
  });

  it('totalPages calculates correctly', () => {
    store.total.set(50);
    store.pageSize.set(20);

    expect(store.totalPages()).toBe(3);
  });

  it('maps unauthorized error to session expired message', async () => {
    repo.getClients.mockRejectedValueOnce(new ClientUnauthorizedError());

    await store.loadClients();

    expect(store.error()).toBe('Your session has expired. Please sign in again.');
  });

  it('maps not found error to specific message', async () => {
    repo.getClientById.mockRejectedValueOnce(new ClientNotFoundError());

    await store.loadClientById(1);

    expect(store.error()).toBe('The selected client no longer exists.');
  });

  it('maps API error to fallback message', async () => {
    repo.getClients.mockRejectedValueOnce(new ClientApiError('Service unavailable'));

    await store.loadClients();

    expect(store.error()).toBe('Service unavailable');
  });
});

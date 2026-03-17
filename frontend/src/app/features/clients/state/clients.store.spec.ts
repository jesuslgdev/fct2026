import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ClientsStore } from './clients.store';
import { AuthService } from '@core/services/auth.service';
import { GetClientsUseCase } from '@domain/usecases/client/get-clients.usecase';
import { CreateClientUseCase } from '@domain/usecases/client/create-client.usecase';
import { UpdateClientUseCase } from '@domain/usecases/client/update-client.usecase';
import { ToggleClientStatusUseCase } from '@domain/usecases/client/toggle-client-status.usecase';
import { GetClientByIdUseCase } from '@domain/usecases/client/get-client-by-id.usecase';
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

class MockGetClientsUseCase {
  execute = vi.fn<(params: ClientQueryParams) => Promise<PagedResult<Client>>>();
}

class MockCreateClientUseCase {
  execute = vi.fn<(payload: CreateClientPayload) => Promise<Client>>();
}

class MockUpdateClientUseCase {
  execute = vi.fn<(id: number, payload: UpdateClientPayload) => Promise<Client>>();
}

class MockToggleClientStatusUseCase {
  execute = vi.fn<(id: number, isActive: boolean) => Promise<void>>();
}

class MockGetClientByIdUseCase {
  execute = vi.fn<(id: number) => Promise<Client>>();
}

describe('ClientsStore', () => {
  let store: ClientsStore;
  let getClientsUseCase: MockGetClientsUseCase;
  let createClientUseCase: MockCreateClientUseCase;
  let updateClientUseCase: MockUpdateClientUseCase;
  let toggleClientStatusUseCase: MockToggleClientStatusUseCase;
  let getClientByIdUseCase: MockGetClientByIdUseCase;

  beforeEach(() => {
    getClientsUseCase = new MockGetClientsUseCase();
    createClientUseCase = new MockCreateClientUseCase();
    updateClientUseCase = new MockUpdateClientUseCase();
    toggleClientStatusUseCase = new MockToggleClientStatusUseCase();
    getClientByIdUseCase = new MockGetClientByIdUseCase();

    TestBed.configureTestingModule({
      providers: [
        ClientsStore,
        { provide: AuthService, useValue: new MockAuthService() },
        { provide: GetClientsUseCase, useValue: getClientsUseCase },
        { provide: CreateClientUseCase, useValue: createClientUseCase },
        { provide: UpdateClientUseCase, useValue: updateClientUseCase },
        { provide: ToggleClientStatusUseCase, useValue: toggleClientStatusUseCase },
        { provide: GetClientByIdUseCase, useValue: getClientByIdUseCase },
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
    getClientsUseCase.execute.mockResolvedValue(response);

    await store.loadClients();

    expect(getClientsUseCase.execute).toHaveBeenCalledWith({
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
    getClientsUseCase.execute.mockRejectedValueOnce(new Error('boom'));

    await store.loadClients();

    expect(store.error()).toBe('Failed to load clients.');
    expect(store.loading()).toBe(false);
  });

  it('maps forbidden clients error to a specific message', async () => {
    getClientsUseCase.execute.mockRejectedValueOnce(new ClientForbiddenError());

    await store.loadClients();

    expect(store.error()).toBe('You do not have permissions to perform this action.');
  });

  it('maps validation clients error to backend message', async () => {
    createClientUseCase.execute.mockRejectedValueOnce(
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

    expect(store.error()).toBe('Tax ID already exists.');
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
    createClientUseCase.execute.mockResolvedValueOnce(CLIENT_B);

    store.clients.set([CLIENT_A]);
    store.total.set(1);
    store.dialogVisible.set(true);

    await store.saveClient(payload);

    expect(createClientUseCase.execute).toHaveBeenCalledWith(payload);
    expect(store.clients()).toEqual([CLIENT_A, CLIENT_B]);
    expect(store.total()).toBe(2);
    expect(store.dialogVisible()).toBe(false);
    expect(store.selectedClient()).toBeNull();
  });

  it('updates an existing client in edit mode', async () => {
    const updated: Client = { ...CLIENT_A, name: 'Acme Corporation' };
    const payload: UpdateClientPayload = { name: 'Acme Corporation' };
    updateClientUseCase.execute.mockResolvedValueOnce(updated);

    store.clients.set([CLIENT_A]);
    store.selectedClient.set(CLIENT_A);
    store.dialogMode.set('edit');

    await store.saveClient(payload);

    expect(updateClientUseCase.execute).toHaveBeenCalledWith(CLIENT_A.clientId, payload);
    expect(store.clients()).toEqual([updated]);
    expect(store.dialogVisible()).toBe(false);
  });

  it('toggles status and closes confirm dialog', async () => {
    toggleClientStatusUseCase.execute.mockResolvedValueOnce();

    store.clients.set([CLIENT_A]);
    store.clientToToggle.set(CLIENT_A);
    store.confirmDialogVisible.set(true);

    await store.confirmToggleStatus();

    expect(toggleClientStatusUseCase.execute).toHaveBeenCalledWith(CLIENT_A.clientId, false);
    expect(store.clients()[0].isActive).toBe(false);
    expect(store.confirmDialogVisible()).toBe(false);
    expect(store.clientToToggle()).toBeNull();
  });

  it('loads client by ID successfully', async () => {
    getClientByIdUseCase.execute.mockResolvedValueOnce(CLIENT_A);

    await store.loadClientById(1);

    expect(getClientByIdUseCase.execute).toHaveBeenCalledWith(1);
    expect(store.selectedClient()).toEqual(CLIENT_A);
    expect(store.loading()).toBe(false);
  });

  it('sets error when loading client by ID fails', async () => {
    getClientByIdUseCase.execute.mockRejectedValueOnce(new Error('not found'));

    await store.loadClientById(1);

    expect(store.error()).toBe('Failed to load client.');
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

  it('open edit dialog sets correct state', async () => {
    getClientByIdUseCase.execute.mockResolvedValue(CLIENT_A);
    
    await store.openEditDialog(CLIENT_A);

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
    getClientsUseCase.execute.mockRejectedValueOnce(new ClientUnauthorizedError());

    await store.loadClients();

    expect(store.error()).toBe('Your session has expired. Please sign in again.');
  });

  it('maps not found error to specific message', async () => {
    getClientByIdUseCase.execute.mockRejectedValueOnce(new ClientNotFoundError());

    await store.loadClientById(1);

    expect(store.error()).toBe('The selected client no longer exists.');
  });

  it('maps API error to fallback message', async () => {
    getClientsUseCase.execute.mockRejectedValueOnce(new ClientApiError('Service unavailable'));

    await store.loadClients();

    expect(store.error()).toBe('Service unavailable');
  });
});

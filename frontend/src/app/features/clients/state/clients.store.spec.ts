import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ClientsStore } from './clients.store';
import { AuthService } from '@core/services/auth.service';
import { UserRole } from '@domain/enums/user-role.enum';
import { GetClientsUseCase } from '@domain/usecases/client/get-clients.usecase';
import { CreateClientUseCase } from '@domain/usecases/client/create-client.usecase';
import { UpdateClientUseCase } from '@domain/usecases/client/update-client.usecase';
import { ToggleClientStatusUseCase } from '@domain/usecases/client/toggle-client-status.usecase';
import { GetClientByIdUseCase } from '@domain/usecases/client/get-client-by-id.usecase';
import { AuthUser } from '@domain/models/auth-user.model';
import {
  Client,
  ClientDetail,
  CreateClientPayload,
  UpdateClientPayload,
  PagedResult,
} from '@domain/models/client.model';
import {
  ClientForbiddenError,
  ClientValidationError,
  ClientUnauthorizedError,
  ClientNotFoundError,
  ClientApiError,
} from '@domain/models/client-errors';

const CLIENT_DETAIL_A: ClientDetail = {
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
};

const CLIENT_SUMMARY_A: Client = {
  clientId: 1,
  name: 'Acme Corp',
  taxId: '12345678A',
  city: 'Madrid',
  isActive: true,
};

const CLIENT_DETAIL_B: ClientDetail = {
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
};

const CLIENT_SUMMARY_B: Client = {
  clientId: 2,
  name: 'Beta SL',
  taxId: '87654321B',
  city: 'Barcelona',
  isActive: true,
};

class MockAuthService {
  readonly user = signal<AuthUser | null>({
    uid: 'uid-1',
    email: 'admin@example.com',
    displayName: 'Admin',
    photoURL: null,
    role: UserRole.Administrator,
  });
}

class MockGetClientsUseCase {
  execute = vi.fn().mockImplementation(() => of({ data: [], total: 0, page: 1, pageSize: 20 }));
}

class MockCreateClientUseCase {
  execute = vi.fn().mockImplementation(() => of(CLIENT_DETAIL_B));
}

class MockUpdateClientUseCase {
  execute = vi.fn().mockImplementation(() => of(CLIENT_DETAIL_A));
}

class MockToggleClientStatusUseCase {
  execute = vi.fn().mockImplementation(() => of(undefined));
}

class MockGetClientByIdUseCase {
  execute = vi.fn().mockImplementation(() => of(CLIENT_DETAIL_A));
}

describe('ClientsStore', () => {
  let store: ClientsStore;
  let getClientsUseCase: MockGetClientsUseCase;
  let createClientUseCase: MockCreateClientUseCase;
  let updateClientUseCase: MockUpdateClientUseCase;
  let toggleClientStatusUseCase: MockToggleClientStatusUseCase;
  let getClientByIdUseCase: MockGetClientByIdUseCase;
  let authServiceMock: MockAuthService;

  beforeEach(() => {
    getClientsUseCase = new MockGetClientsUseCase();
    createClientUseCase = new MockCreateClientUseCase();
    updateClientUseCase = new MockUpdateClientUseCase();
    toggleClientStatusUseCase = new MockToggleClientStatusUseCase();
    getClientByIdUseCase = new MockGetClientByIdUseCase();
    authServiceMock = new MockAuthService();

    TestBed.configureTestingModule({
      providers: [
        ClientsStore,
        { provide: AuthService, useValue: authServiceMock },
        { provide: GetClientsUseCase, useValue: getClientsUseCase as unknown as GetClientsUseCase },
        { provide: CreateClientUseCase, useValue: createClientUseCase as unknown as CreateClientUseCase },
        { provide: UpdateClientUseCase, useValue: updateClientUseCase as unknown as UpdateClientUseCase },
        { provide: ToggleClientStatusUseCase, useValue: toggleClientStatusUseCase as unknown as ToggleClientStatusUseCase },
        { provide: GetClientByIdUseCase, useValue: getClientByIdUseCase as unknown as GetClientByIdUseCase },
      ],
    });

    store = TestBed.inject(ClientsStore);
  });

  it('loads clients and total successfully', async () => {
    const response: PagedResult<Client> = {
      data: [CLIENT_SUMMARY_A, CLIENT_SUMMARY_B],
      total: 2,
      page: 1,
      pageSize: 20,
    };
    getClientsUseCase.execute.mockReturnValue(of(response));

    await store.loadClients();

    expect(getClientsUseCase.execute).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      search: undefined,
      isActive: undefined,
    });
    expect(store.clients()).toEqual([CLIENT_SUMMARY_A, CLIENT_SUMMARY_B]);
    expect(store.total()).toBe(2);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('sets error when loading clients fails', async () => {
    getClientsUseCase.execute.mockReturnValueOnce(throwError(() => new Error('boom')));

    await store.loadClients();

    expect(store.error()).toBe('Failed to load clients.');
    expect(store.loading()).toBe(false);
  });

  it('maps forbidden clients error to a specific message', async () => {
    getClientsUseCase.execute.mockReturnValueOnce(throwError(() => new ClientForbiddenError()));

    await store.loadClients();

    expect(store.error()).toBe('You do not have permissions to perform this action.');
  });

  it('maps validation clients error to backend message', async () => {
    createClientUseCase.execute.mockReturnValueOnce(
      throwError(() => new ClientValidationError({ field: 'taxId' }, 'Tax ID already exists.')),
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
    } as unknown as CreateClientPayload);

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
    createClientUseCase.execute.mockReturnValueOnce(of(CLIENT_DETAIL_B));

    store.clients.set([CLIENT_SUMMARY_A]);
    store.total.set(1);
    store.dialogVisible.set(true);

    await store.saveClient(payload);

    expect(createClientUseCase.execute).toHaveBeenCalledWith(payload);
    expect(store.clients()).toEqual([CLIENT_SUMMARY_A, CLIENT_SUMMARY_B]);
    expect(store.total()).toBe(2);
    expect(store.dialogVisible()).toBe(false);
    expect(store.selectedClient()).toBeNull();
  });

  it('updates an existing client in edit mode', async () => {
    const updatedDetail: ClientDetail = { ...CLIENT_DETAIL_A, name: 'Acme Corporation' };
    const updatedSummary: Client = { ...CLIENT_SUMMARY_A, name: 'Acme Corporation' };
    const payload: UpdateClientPayload = { name: 'Acme Corporation' };
    updateClientUseCase.execute.mockReturnValueOnce(of(updatedDetail));

    store.clients.set([CLIENT_SUMMARY_A]);
    store.selectedClient.set(CLIENT_DETAIL_A);
    store.dialogMode.set('edit');

    await store.saveClient(payload);

    expect(updateClientUseCase.execute).toHaveBeenCalledWith(CLIENT_DETAIL_A.clientId, payload);
    expect(store.clients()).toEqual([updatedSummary]);
    expect(store.dialogVisible()).toBe(false);
  });

  it('toggles status and closes confirm dialog', async () => {
    toggleClientStatusUseCase.execute.mockReturnValueOnce(of(undefined));

    store.clients.set([CLIENT_SUMMARY_A]);
    store.clientToToggle.set(CLIENT_SUMMARY_A);
    store.confirmDialogVisible.set(true);

    await store.confirmToggleStatus();

    expect(toggleClientStatusUseCase.execute).toHaveBeenCalledWith(CLIENT_SUMMARY_A.clientId, false);
    expect(store.clients()[0].isActive).toBe(false);
    expect(store.confirmDialogVisible()).toBe(false);
    expect(store.clientToToggle()).toBeNull();
  });

  it('loads client by ID successfully', async () => {
    getClientByIdUseCase.execute.mockReturnValueOnce(of(CLIENT_DETAIL_A));

    await store.loadClientById(1);

    expect(getClientByIdUseCase.execute).toHaveBeenCalledWith(1);
    expect(store.selectedClient()).toEqual(CLIENT_DETAIL_A);
    expect(store.loading()).toBe(false);
  });

  it('sets error when loading client by ID fails', async () => {
    getClientByIdUseCase.execute.mockReturnValueOnce(throwError(() => new Error('not found')));

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
    store.selectedClient.set(CLIENT_DETAIL_A);
    store.dialogMode.set('edit');

    store.openCreateDialog();

    expect(store.selectedClient()).toBeNull();
    expect(store.dialogMode()).toBe('create');
    expect(store.dialogVisible()).toBe(true);
  });

  it('open edit dialog calls loadClientDetail', async () => {
    getClientByIdUseCase.execute.mockReturnValue(of(CLIENT_DETAIL_A));

    await store.openEditDialog(CLIENT_SUMMARY_A);

    expect(getClientByIdUseCase.execute).toHaveBeenCalledWith(CLIENT_SUMMARY_A.clientId);
    expect(store.selectedClient()).toEqual(CLIENT_DETAIL_A);
    expect(store.dialogMode()).toBe('edit');
    expect(store.dialogVisible()).toBe(true);
  });

  it('close dialog resets state', () => {
    store.selectedClient.set(CLIENT_DETAIL_A);
    store.dialogVisible.set(true);

    store.closeDialog();

    expect(store.dialogVisible()).toBe(false);
    expect(store.selectedClient()).toBeNull();
  });

  it('request toggle status sets confirm dialog', () => {
    store.requestToggleStatus(CLIENT_SUMMARY_A);

    expect(store.clientToToggle()).toEqual(CLIENT_SUMMARY_A);
    expect(store.confirmDialogVisible()).toBe(true);
  });

  it('cancel toggle status resets confirm dialog', () => {
    store.clientToToggle.set(CLIENT_SUMMARY_A);
    store.confirmDialogVisible.set(true);

    store.cancelToggleStatus();

    expect(store.confirmDialogVisible()).toBe(false);
    expect(store.clientToToggle()).toBeNull();
  });

  it('canEdit returns true for Administrator', () => {
    expect(store.canEdit()).toBe(true);
  });

  it('canEdit returns false for Sales Manager', () => {
    authServiceMock.user.set({
      uid: 'u1',
      email: 'm@sales.com',
      displayName: 'Sales Mgr',
      photoURL: null,
      role: UserRole.Manager,
    });
    expect(store.canEdit()).toBe(false);
  });

  it('canEdit returns false for Non-Sales Manager', () => {
    authServiceMock.user.set({
      uid: 'u2',
      email: 'm@other.com',
      displayName: 'Other Mgr',
      photoURL: null,
      role: UserRole.Manager,
    });
    expect(store.canEdit()).toBe(false);
  });

  it('totalPages calculates correctly', () => {
    store.total.set(50);
    store.pageSize.set(20);

    expect(store.totalPages()).toBe(3);
  });

  it('maps unauthorized error to session expired message', async () => {
    getClientsUseCase.execute.mockReturnValueOnce(throwError(() => new ClientUnauthorizedError()));

    await store.loadClients();

    expect(store.error()).toBe('Your session has expired. Please sign in again.');
  });

  it('maps not found error to specific message', async () => {
    getClientByIdUseCase.execute.mockReturnValueOnce(throwError(() => new ClientNotFoundError()));

    await store.loadClientById(1);

    expect(store.error()).toBe('The selected client no longer exists.');
  });

  it('maps API error to fallback message', async () => {
    getClientsUseCase.execute.mockReturnValueOnce(
      throwError(() => new ClientApiError('Service unavailable')),
    );

    await store.loadClients();

    expect(store.error()).toBe('Service unavailable');
  });
});
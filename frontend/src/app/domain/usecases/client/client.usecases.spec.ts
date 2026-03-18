import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ClientRepository } from '@domain/repositories/client.repository';
import {
  Client,
  CreateClientPayload,
  UpdateClientPayload,
  ClientQueryParams,
  PagedResult,
} from '@domain/models/client.model';
import { GetClientsUseCase } from './get-clients.usecase';
import { GetClientByIdUseCase } from './get-client-by-id.usecase';
import { CreateClientUseCase } from './create-client.usecase';
import { UpdateClientUseCase } from './update-client.usecase';
import { ToggleClientStatusUseCase } from './toggle-client-status.usecase';

const CLIENT_MOCK: Client = {
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

class MockClientRepository implements ClientRepository {
  getClients = vi.fn<(params: ClientQueryParams) => Promise<PagedResult<Client>>>();
  getClientById = vi.fn<(id: number) => Promise<Client>>();
  createClient = vi.fn<(payload: CreateClientPayload) => Promise<Client>>();
  updateClient = vi.fn<(id: number, payload: UpdateClientPayload) => Promise<Client>>();
  toggleClientStatus = vi.fn<(id: number, isActive: boolean) => Promise<void>>();
}

describe('Client Use Cases', () => {
  let repo: MockClientRepository;

  beforeEach(() => {
    repo = new MockClientRepository();
    TestBed.configureTestingModule({
      providers: [
        GetClientsUseCase,
        GetClientByIdUseCase,
        CreateClientUseCase,
        UpdateClientUseCase,
        ToggleClientStatusUseCase,
        { provide: ClientRepository, useValue: repo },
      ],
    });
  });

  it('GetClientsUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetClientsUseCase);
    const params: ClientQueryParams = { page: 1, pageSize: 20 };
    const resultMock: PagedResult<Client> = {
      data: [CLIENT_MOCK],
      total: 1,
      page: 1,
      pageSize: 20,
    };
    repo.getClients.mockResolvedValueOnce(resultMock);

    const result = await useCase.execute(params);

    expect(repo.getClients).toHaveBeenCalledOnce();
    expect(repo.getClients).toHaveBeenCalledWith(params);
    expect(result).toEqual(resultMock);
  });

  it('GetClientByIdUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(GetClientByIdUseCase);
    repo.getClientById.mockResolvedValueOnce(CLIENT_MOCK);

    const result = await useCase.execute(1);

    expect(repo.getClientById).toHaveBeenCalledWith(1);
    expect(result).toEqual(CLIENT_MOCK);
  });

  it('CreateClientUseCase creates client with valid tax ID', async () => {
    const useCase = TestBed.inject(CreateClientUseCase);
    const payload: CreateClientPayload = {
      name: 'Test Client',
      taxId: '12345678A',
      address: 'Test Address',
      city: 'Test City',
      province: 'Test Province',
      postalCode: '12345',
      phone: '123456789',
      email: 'test@example.com',
    };
    repo.createClient.mockResolvedValueOnce(CLIENT_MOCK);

    const result = await useCase.execute(payload);

    expect(repo.createClient).toHaveBeenCalledWith(payload);
    expect(result).toEqual(CLIENT_MOCK);
  });

  it('CreateClientUseCase creates client with any tax ID', async () => {
    const useCase = TestBed.inject(CreateClientUseCase);
    const payload: CreateClientPayload = {
      name: 'Test Client',
      taxId: 'INVALID',
      address: 'Test Address',
      city: 'Test City',
      province: 'Test Province',
      postalCode: '12345',
      phone: '123456789',
      email: 'test@example.com',
    };
    repo.createClient.mockResolvedValueOnce({ ...CLIENT_MOCK, ...payload });

    const result = await useCase.execute(payload);

    expect(repo.createClient).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ ...CLIENT_MOCK, ...payload });
  });

  it('CreateClientUseCase propagates repository errors', async () => {
    const useCase = TestBed.inject(CreateClientUseCase);
    const payload: CreateClientPayload = {
      name: 'Test Client',
      taxId: '12345678A',
      address: 'Test Address',
      city: 'Test City',
      province: 'Test Province',
      postalCode: '12345',
      phone: '123456789',
      email: 'test@example.com',
    };
    repo.createClient.mockRejectedValueOnce(new Error('Repository error'));

    await expect(useCase.execute(payload)).rejects.toThrow('Repository error');
    expect(repo.createClient).toHaveBeenCalledWith(payload);
  });

  it('UpdateClientUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(UpdateClientUseCase);
    const payload: UpdateClientPayload = { name: 'Updated Client' };
    const updated: Client = { ...CLIENT_MOCK, name: 'Updated Client' };
    repo.updateClient.mockResolvedValueOnce(updated);

    const result = await useCase.execute(1, payload);

    expect(repo.updateClient).toHaveBeenCalledWith(1, payload);
    expect(result).toEqual(updated);
  });

  it('ToggleClientStatusUseCase delegates to repository', async () => {
    const useCase = TestBed.inject(ToggleClientStatusUseCase);
    repo.toggleClientStatus.mockResolvedValueOnce();

    await useCase.execute(1, false);

    expect(repo.toggleClientStatus).toHaveBeenCalledWith(1, false);
    expect(repo.toggleClientStatus).toHaveBeenCalledOnce();
  });
});

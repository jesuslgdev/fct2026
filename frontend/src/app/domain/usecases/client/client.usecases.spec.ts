import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { GetClientsUseCase } from './get-clients.usecase';
import { CreateClientUseCase } from './create-client.usecase';
import { ClientRepository } from '@domain/repositories/client.repository';
import { Client } from '@domain/models/client.model';
import { ClientAlreadyExistsError, ClientInvalidTaxIdError } from '@domain/models/client-errors';

describe('Client Use Cases', () => {
  let mockClientRepository: jasmine.SpyObj<ClientRepository>;
  let getClientsUseCase: GetClientsUseCase;
  let createClientUseCase: CreateClientUseCase;

  const mockClient: Client = {
    clientId: 1,
    name: 'Test Client',
    taxId: 'B12345678',
    address: 'Test Address',
    city: 'Test City',
    province: 'Test Province',
    postalCode: '12345',
    phone: '123456789',
    email: 'test@example.com',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    mockClientRepository = jasmine.createSpyObj('ClientRepository', [
      'getClients',
      'createClient',
      'getClientById',
      'updateClient',
      'toggleClientStatus',
    ]);

    TestBed.configureTestingModule({
      providers: [
        GetClientsUseCase,
        CreateClientUseCase,
        { provide: ClientRepository, useValue: mockClientRepository },
      ],
    });

    getClientsUseCase = TestBed.inject(GetClientsUseCase);
    createClientUseCase = TestBed.inject(CreateClientUseCase);
  });

  describe('GetClientsUseCase', () => {
    it('should get clients with pagination', async () => {
      const expectedResult = {
        data: [mockClient],
        total: 1,
        page: 1,
        pageSize: 20,
      };
      mockClientRepository.getClients.and.returnValue(Promise.resolve(expectedResult));

      const result = await getClientsUseCase.execute({ page: 1, pageSize: 20 });

      expect(result).toEqual(expectedResult);
      expect(mockClientRepository.getClients).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    });
  });

  describe('CreateClientUseCase', () => {
    it('should create client with valid tax ID', async () => {
      const payload = {
        name: 'Test Client',
        taxId: 'B12345678',
        address: 'Test Address',
        city: 'Test City',
        province: 'Test Province',
        postalCode: '12345',
        phone: '123456789',
        email: 'test@example.com',
      };

      mockClientRepository.createClient.and.returnValue(Promise.resolve(mockClient));

      const result = await createClientUseCase.execute(payload);

      expect(result).toEqual(mockClient);
      expect(mockClientRepository.createClient).toHaveBeenCalledWith(payload);
    });

    it('should throw error for invalid tax ID', async () => {
      const payload = {
        name: 'Test Client',
        taxId: 'INVALID',
        address: 'Test Address',
        city: 'Test City',
        province: 'Test Province',
        postalCode: '12345',
        phone: '123456789',
        email: 'test@example.com',
      };

      await expectAsync(createClientUseCase.execute(payload)).toBeRejectedWithError(
        ClientInvalidTaxIdError
      );
    });
  });
});

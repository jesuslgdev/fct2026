import { describe, it, expect } from 'vitest';
import { Provider, CreateProviderRequest, UpdateProviderRequest } from './provider.model';
import { ProviderStatus } from '../enums/provider-status.enum';

describe('Provider Models', () => {
  const mockProvider: Provider = {
    id: '1',
    name: 'Test Provider',
    taxId: '123456789',
    email: 'provider@test.com',
    phone: '+1234567890',
    address: 'Test Address',
    contactPerson: 'Contact Person',
    isActive: true,
    status: ProviderStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    products: []
  };

  describe('Provider', () => {
    it('should create a valid provider', () => {
      expect(mockProvider.id).toBe('1');
      expect(mockProvider.name).toBe('Test Provider');
      expect(mockProvider.taxId).toBe('123456789');
      expect(mockProvider.email).toBe('provider@test.com');
      expect(mockProvider.isActive).toBe(true);
      expect(mockProvider.status).toBe(ProviderStatus.ACTIVE);
    });

    it('should accept optional properties', () => {
      const minimalProvider: Provider = {
        id: '2',
        name: 'Minimal Provider',
        taxId: '987654321',
        email: 'minimal@test.com',
        isActive: false,
        status: ProviderStatus.INACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      expect(minimalProvider.phone).toBeUndefined();
      expect(minimalProvider.address).toBeUndefined();
      expect(minimalProvider.contactPerson).toBeUndefined();
      expect(minimalProvider.products).toBeUndefined();
    });
  });

  describe('CreateProviderRequest', () => {
    it('should create a valid create request', () => {
      const createRequest: CreateProviderRequest = {
        name: 'New Provider',
        taxId: '111111111',
        email: 'new@test.com',
        phone: '+1111111111',
        address: 'New Address',
        contactPerson: 'New Contact'
      };
      expect(createRequest.name).toBe('New Provider');
      expect(createRequest.taxId).toBe('111111111');
      expect(createRequest.email).toBe('new@test.com');
    });

    it('should accept optional properties', () => {
      const minimalRequest: CreateProviderRequest = {
        name: 'Minimal Provider',
        taxId: '222222222',
        email: 'minimal@test.com'
      };
      expect(minimalRequest.phone).toBeUndefined();
      expect(minimalRequest.address).toBeUndefined();
      expect(minimalRequest.contactPerson).toBeUndefined();
    });
  });

  describe('UpdateProviderRequest', () => {
    it('should extend CreateProviderRequest and add isActive', () => {
      const updateRequest: UpdateProviderRequest = {
        name: 'Updated Provider',
        isActive: false
      };
      expect(updateRequest.name).toBe('Updated Provider');
      expect(updateRequest.isActive).toBe(false);
    });

    it('should accept only isActive property', () => {
      const statusUpdate: UpdateProviderRequest = {
        isActive: true
      };
      expect(statusUpdate.isActive).toBe(true);
      expect(statusUpdate.name).toBeUndefined();
    });
  });
});

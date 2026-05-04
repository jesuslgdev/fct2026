import { describe, it, expect } from 'vitest';
import { Supplier, CreateSupplierRequest, UpdateSupplierRequest } from './supplier.model';
import { SupplierStatus } from '../enums/supplier-status.enum';

describe('Supplier Models', () => {
  const mockProvider: Supplier = {
    id: '1',
    name: 'Test Supplier',
    taxId: '123456789',
    email: 'supplier@test.com',
    phone: '+1234567890',
    address: 'Test Address',
    isActive: true,
    status: SupplierStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    products: []
  };

  describe('Supplier', () => {
    it('should create a valid supplier', () => {
      expect(mockProvider.id).toBe('1');
      expect(mockProvider.name).toBe('Test Supplier');
      expect(mockProvider.taxId).toBe('123456789');
      expect(mockProvider.email).toBe('supplier@test.com');
      expect(mockProvider.isActive).toBe(true);
      expect(mockProvider.status).toBe(SupplierStatus.ACTIVE);
    });

    it('should accept optional properties', () => {
      const minimalProvider: Supplier = {
        id: '2',
        name: 'Minimal Supplier',
        taxId: '987654321',
        email: 'minimal@test.com',
        isActive: false,
        status: SupplierStatus.INACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      expect(minimalProvider.phone).toBeUndefined();
      expect(minimalProvider.address).toBeUndefined();
      expect(minimalProvider.products).toBeUndefined();
    });
  });

  describe('CreateSupplierRequest', () => {
    it('should create a valid create request', () => {
      const createRequest: CreateSupplierRequest = {
        name: 'New Supplier',
        taxId: '111111111',
        email: 'new@test.com',
        phone: '+1111111111',
        address: 'New Address'
      };
      expect(createRequest.name).toBe('New Supplier');
      expect(createRequest.taxId).toBe('111111111');
      expect(createRequest.email).toBe('new@test.com');
    });

    it('should accept optional properties', () => {
      const minimalRequest: CreateSupplierRequest = {
        name: 'Minimal Supplier',
        taxId: '222222222',
        email: 'minimal@test.com'
      };
      expect(minimalRequest.phone).toBeUndefined();
      expect(minimalRequest.address).toBeUndefined();
    });
  });

  describe('UpdateSupplierRequest', () => {
    it('should extend CreateSupplierRequest and add isActive', () => {
      const updateRequest: UpdateSupplierRequest = {
        name: 'Updated Supplier',
        isActive: false
      };
      expect(updateRequest.name).toBe('Updated Supplier');
      expect(updateRequest.isActive).toBe(false);
    });

    it('should accept only isActive property', () => {
      const statusUpdate: UpdateSupplierRequest = {
        isActive: true
      };
      expect(statusUpdate.isActive).toBe(true);
      expect(statusUpdate.name).toBeUndefined();
    });
  });
});


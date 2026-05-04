import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SupplierRepository } from '../../repositories/supplier.repository';
import {
  Supplier,
  UpdateSupplierRequest,
  SupplierImportExecutionResult,
  SupplierImportTemplate,
} from '../../models/supplier.model';
import { SupplierProduct } from '../../models/supplier-product.model';
import { PageEvent } from '../../models/page-event.model';
import { SupplierStatus } from '../../enums/supplier-status.enum';
import { 
  GetSuppliersUseCase, 
  GetSupplierByIdUseCase, 
  UpdateSupplierUseCase, 
  ActivateSupplierUseCase, 
  DeactivateSupplierUseCase,
  GetSupplierProductsUseCase,
  DownloadSupplierTemplateUseCase,
  ImportSuppliersUseCase,
} from './index';

const MOCK_SUPPLIER: Supplier = {
  id: '1',
  name: 'Test Supplier',
  taxId: '123456789',
  email: 'supplier@test.com',
  isActive: true,
  status: SupplierStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date()
};

const MOCK_PAGE_EVENT: PageEvent = {
  first: 0,
  rows: 20,
  page: 1,
  pageCount: 5
};

const MOCK_SUPPLIER_PRODUCT: SupplierProduct = {
  id: 'pp-1',
  productId: 'product-1',
  productName: 'Test Product',
  supplierId: '1',
  specificPrice: 12.5,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_TEMPLATE: SupplierImportTemplate = {
  filename: 'plantilla_proveedores.xlsx',
  data: new ArrayBuffer(8),
};

const MOCK_IMPORT_RESULT: SupplierImportExecutionResult = {
  success: true,
  importedCount: 2,
  message: 'Import completed successfully',
};

class MockSupplierRepository implements SupplierRepository {
  getSuppliers = vi.fn().mockResolvedValue({
    data: [MOCK_SUPPLIER],
    total: 1
  });
  getSupplierById = vi.fn().mockResolvedValue(MOCK_SUPPLIER);
  createSupplier = vi.fn().mockResolvedValue(MOCK_SUPPLIER);
  updateSupplier = vi.fn().mockResolvedValue(MOCK_SUPPLIER);
  activateSupplier = vi.fn().mockResolvedValue(MOCK_SUPPLIER);
  deactivateSupplier = vi.fn().mockResolvedValue(MOCK_SUPPLIER);
  getSupplierProducts = vi.fn().mockResolvedValue([MOCK_SUPPLIER_PRODUCT]);
  downloadImportTemplate = vi.fn().mockResolvedValue(MOCK_TEMPLATE);
  importSuppliers = vi.fn().mockResolvedValue(MOCK_IMPORT_RESULT);
}

describe('Supplier Use Cases', () => {
  let mockRepo: MockSupplierRepository;

  beforeEach(() => {
    mockRepo = new MockSupplierRepository();
    TestBed.configureTestingModule({
      providers: [
        GetSuppliersUseCase,
        GetSupplierByIdUseCase,
        UpdateSupplierUseCase,
        ActivateSupplierUseCase,
        DeactivateSupplierUseCase,
        GetSupplierProductsUseCase,
        DownloadSupplierTemplateUseCase,
        ImportSuppliersUseCase,
        { provide: SupplierRepository, useValue: mockRepo },
      ],
    });
  });

  describe('GetSuppliersUseCase', () => {
    it('should call getSuppliers and return paginated results', async () => {
      const useCase = TestBed.inject(GetSuppliersUseCase) as GetSuppliersUseCase;
      const result = await useCase.execute(MOCK_PAGE_EVENT);
      
      expect(mockRepo.getSuppliers).toHaveBeenCalledWith(MOCK_PAGE_EVENT);
      expect(mockRepo.getSuppliers).toHaveBeenCalledOnce();
      expect(result).toEqual({
        data: [MOCK_SUPPLIER],
        total: 1
      });
    });

    it('should call getSuppliers without pagination params', async () => {
      const useCase = TestBed.inject(GetSuppliersUseCase) as GetSuppliersUseCase;
      await useCase.execute();
      
      expect(mockRepo.getSuppliers).toHaveBeenCalledWith(undefined);
    });
  });

  describe('GetSupplierByIdUseCase', () => {
    it('should call getSupplierById and return supplier', async () => {
      const useCase = TestBed.inject(GetSupplierByIdUseCase) as GetSupplierByIdUseCase;
      const result = await useCase.execute('1');
      
      expect(mockRepo.getSupplierById).toHaveBeenCalledWith('1');
      expect(mockRepo.getSupplierById).toHaveBeenCalledOnce();
      expect(result).toEqual(MOCK_SUPPLIER);
    });
  });

  describe('UpdateSupplierUseCase', () => {
    it('should call updateSupplier and return updated supplier', async () => {
      const useCase = TestBed.inject(UpdateSupplierUseCase) as UpdateSupplierUseCase;
      const updateData: UpdateSupplierRequest = {
        name: 'Updated Supplier',
        isActive: false
      };
      const result = await useCase.execute('1', updateData);
      
      expect(mockRepo.updateSupplier).toHaveBeenCalledWith('1', updateData);
      expect(mockRepo.updateSupplier).toHaveBeenCalledOnce();
      expect(result).toEqual(MOCK_SUPPLIER);
    });
  });

  describe('ActivateSupplierUseCase', () => {
    it('should call activateSupplier and return supplier', async () => {
      const useCase = TestBed.inject(ActivateSupplierUseCase) as ActivateSupplierUseCase;
      const result = await useCase.execute('1');
      
      expect(mockRepo.activateSupplier).toHaveBeenCalledWith('1');
      expect(mockRepo.activateSupplier).toHaveBeenCalledOnce();
      expect(result).toEqual(MOCK_SUPPLIER);
    });
  });

  describe('DeactivateSupplierUseCase', () => {
    it('should call deactivateSupplier and return supplier', async () => {
      const useCase = TestBed.inject(DeactivateSupplierUseCase) as DeactivateSupplierUseCase;
      const result = await useCase.execute('1');
      
      expect(mockRepo.deactivateSupplier).toHaveBeenCalledWith('1');
      expect(mockRepo.deactivateSupplier).toHaveBeenCalledOnce();
      expect(result).toEqual(MOCK_SUPPLIER);
    });
  });

  describe('GetSupplierProductsUseCase', () => {
    it('should call getSupplierProducts and return products', async () => {
      const useCase = TestBed.inject(GetSupplierProductsUseCase) as GetSupplierProductsUseCase;
      const result = await useCase.execute('1');
      
      expect(mockRepo.getSupplierProducts).toHaveBeenCalledWith('1');
      expect(mockRepo.getSupplierProducts).toHaveBeenCalledOnce();
      expect(result).toEqual([MOCK_SUPPLIER_PRODUCT]);
    });
  });

  describe('DownloadSupplierTemplateUseCase', () => {
    it('should call downloadImportTemplate and return template', async () => {
      const useCase = TestBed.inject(DownloadSupplierTemplateUseCase) as DownloadSupplierTemplateUseCase;
      const result = await useCase.execute();

      expect(mockRepo.downloadImportTemplate).toHaveBeenCalledOnce();
      expect(result).toEqual(MOCK_TEMPLATE);
    });
  });

  describe('ImportSuppliersUseCase', () => {
    it('should call importSuppliers and return import result', async () => {
      const useCase = TestBed.inject(ImportSuppliersUseCase) as ImportSuppliersUseCase;
      const file = new File(['name,taxId,email'], 'suppliers.csv', { type: 'text/csv' });
      const result = await useCase.execute(file);

      expect(mockRepo.importSuppliers).toHaveBeenCalledWith(file);
      expect(result).toEqual(MOCK_IMPORT_RESULT);
    });
  });
});


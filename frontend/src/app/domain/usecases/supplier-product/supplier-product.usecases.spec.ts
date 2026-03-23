import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SupplierProductRepository } from '@domain/repositories/supplier-product.repository';
import {
  SupplierProduct,
  AddSupplierProductRequest,
  UpdateSupplierProductPriceRequest,
  ImportSupplierProductsRequest,
  ImportResult,
} from '@domain/models/supplier-product.model';
import {
  GetSupplierProductsUseCase,
} from './get-supplier-products.usecase';
import {
  AddProductToSupplierUseCase,
} from './add-product-to-supplier.usecase';
import {
  UpdateSupplierProductPriceUseCase,
} from './update-supplier-product-price.usecase';
import {
  RemoveProductFromSupplierUseCase,
} from './remove-product-from-supplier.usecase';
import {
  ImportSupplierProductsUseCase,
} from './import-supplier-products.usecase';

const SUPPLIER_PRODUCT_MOCK: SupplierProduct = {
  supplierId: '1',
  productId: '1',
  productCode: 'PROD001',
  productName: 'Test Product',
  supplierPrice: 100.50,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

class MockSupplierProductRepository implements SupplierProductRepository {
  getSupplierProducts = vi.fn<(supplierId: string) => Promise<SupplierProduct[]>>();
  addProductToSupplier = vi.fn<(supplierId: string, request: AddSupplierProductRequest) => Promise<SupplierProduct>>();
  updateSupplierProductPrice = vi.fn<(supplierId: string, productId: string, request: UpdateSupplierProductPriceRequest) => Promise<SupplierProduct>>();
  removeProductFromSupplier = vi.fn<(supplierId: string, productId: string) => Promise<void>>();
  importSupplierProducts = vi.fn<(supplierId: string, request: ImportSupplierProductsRequest) => Promise<ImportResult>>();
}

describe('Supplier Product Use Cases', () => {
  let repo: MockSupplierProductRepository;
  let getSupplierProductsUseCase: GetSupplierProductsUseCase;
  let addProductToSupplierUseCase: AddProductToSupplierUseCase;
  let updateSupplierProductPriceUseCase: UpdateSupplierProductPriceUseCase;
  let removeProductFromSupplierUseCase: RemoveProductFromSupplierUseCase;
  let importSupplierProductsUseCase: ImportSupplierProductsUseCase;

  beforeEach(() => {
    repo = new MockSupplierProductRepository();
    TestBed.configureTestingModule({
      providers: [
        GetSupplierProductsUseCase,
        AddProductToSupplierUseCase,
        UpdateSupplierProductPriceUseCase,
        RemoveProductFromSupplierUseCase,
        ImportSupplierProductsUseCase,
        { provide: SupplierProductRepository, useValue: repo }
      ]
    });

    getSupplierProductsUseCase = TestBed.inject(GetSupplierProductsUseCase);
    addProductToSupplierUseCase = TestBed.inject(AddProductToSupplierUseCase);
    updateSupplierProductPriceUseCase = TestBed.inject(UpdateSupplierProductPriceUseCase);
    removeProductFromSupplierUseCase = TestBed.inject(RemoveProductFromSupplierUseCase);
    importSupplierProductsUseCase = TestBed.inject(ImportSupplierProductsUseCase);
  });

  describe('GetSupplierProductsUseCase', () => {
    it('should delegate to repository', async () => {
      const supplierId = '1';
      const expectedProducts = [SUPPLIER_PRODUCT_MOCK];

      repo.getSupplierProducts.mockResolvedValue(expectedProducts);

      const result = await getSupplierProductsUseCase.execute(supplierId);

      expect(repo.getSupplierProducts).toHaveBeenCalledWith(supplierId);
      expect(result).toEqual(expectedProducts);
    });

    it('should propagate repository errors', async () => {
      const supplierId = '1';
      const errorMessage = 'Repository error';
      repo.getSupplierProducts.mockRejectedValue(new Error(errorMessage));

      await expect(getSupplierProductsUseCase.execute(supplierId)).rejects.toThrow(errorMessage);
    });
  });

  describe('AddProductToSupplierUseCase', () => {
    it('should delegate to repository', async () => {
      const supplierId = '1';
      const request: AddSupplierProductRequest = {
        productId: '1',
        supplierPrice: 100.50
      };

      repo.addProductToSupplier.mockResolvedValue(SUPPLIER_PRODUCT_MOCK);

      await addProductToSupplierUseCase.execute(supplierId, request);

      expect(repo.addProductToSupplier).toHaveBeenCalledWith(supplierId, request);
    });

    it('should propagate repository errors', async () => {
      const supplierId = '1';
      const request: AddSupplierProductRequest = {
        productId: '1',
        supplierPrice: 100.50
      };
      const errorMessage = 'Repository error';
      repo.addProductToSupplier.mockRejectedValue(new Error(errorMessage));

      await expect(addProductToSupplierUseCase.execute(supplierId, request)).rejects.toThrow(errorMessage);
    });
  });

  describe('UpdateSupplierProductPriceUseCase', () => {
    it('should delegate to repository', async () => {
      const supplierId = '1';
      const productId = '1';
      const request: UpdateSupplierProductPriceRequest = {
        supplierPrice: 150.75
      };

      repo.updateSupplierProductPrice.mockResolvedValue(SUPPLIER_PRODUCT_MOCK);

      await updateSupplierProductPriceUseCase.execute(supplierId, productId, request);

      expect(repo.updateSupplierProductPrice).toHaveBeenCalledWith(supplierId, productId, request);
    });

    it('should propagate repository errors', async () => {
      const supplierId = '1';
      const productId = '1';
      const request: UpdateSupplierProductPriceRequest = {
        supplierPrice: 150.75
      };
      const errorMessage = 'Repository error';
      repo.updateSupplierProductPrice.mockRejectedValue(new Error(errorMessage));

      await expect(updateSupplierProductPriceUseCase.execute(supplierId, productId, request)).rejects.toThrow(errorMessage);
    });
  });

  describe('RemoveProductFromSupplierUseCase', () => {
    it('should delegate to repository', async () => {
      const supplierId = '1';
      const productId = '1';

      repo.removeProductFromSupplier.mockResolvedValue();

      await removeProductFromSupplierUseCase.execute(supplierId, productId);

      expect(repo.removeProductFromSupplier).toHaveBeenCalledWith(supplierId, productId);
    });

    it('should propagate repository errors', async () => {
      const supplierId = '1';
      const productId = '1';
      const errorMessage = 'Repository error';
      repo.removeProductFromSupplier.mockRejectedValue(new Error(errorMessage));

      await expect(removeProductFromSupplierUseCase.execute(supplierId, productId)).rejects.toThrow(errorMessage);
    });
  });

  describe('ImportSupplierProductsUseCase', () => {
    it('should delegate to repository', async () => {
      const supplierId = '1';
      const request: ImportSupplierProductsRequest = {
        products: [
          { productCode: 'PROD001', supplierPrice: 100.50 },
          { productCode: 'PROD002', supplierPrice: 200.75 }
        ]
      };

      const importResult = { total: 2, created: 2, errors: [] };
      repo.importSupplierProducts.mockResolvedValue(importResult);

      const result = await importSupplierProductsUseCase.execute(supplierId, request);

      expect(repo.importSupplierProducts).toHaveBeenCalledWith(supplierId, request);
      expect(result).toEqual(importResult);
    });

    it('should propagate repository errors', async () => {
      const supplierId = '1';
      const request: ImportSupplierProductsRequest = {
        products: [
          { productCode: 'PROD001', supplierPrice: 100.50 }
        ]
      };
      const errorMessage = 'Repository error';
      repo.importSupplierProducts.mockRejectedValue(new Error(errorMessage));

      await expect(importSupplierProductsUseCase.execute(supplierId, request)).rejects.toThrow(errorMessage);
    });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError, firstValueFrom } from 'rxjs';
import { SupplierProductRepository } from '@domain/repositories/supplier-product.repository';
import {
  SupplierProduct,
  AddSupplierProductRequest,
  UpdateSupplierProductPriceRequest,
  ImportSupplierProductsRequest,
  ImportResult,
} from '@domain/models/supplier-product.model';
import { SupplierProductValidationError } from '@domain/models/supplier-product-errors';
import { GetSupplierProductsUseCase } from './get-supplier-products.usecase';
import { AddProductToSupplierUseCase } from './add-product-to-supplier.usecase';
import { UpdateSupplierProductPriceUseCase } from './update-supplier-product-price.usecase';
import { RemoveProductFromSupplierUseCase } from './remove-product-from-supplier.usecase';
import { ImportSupplierProductsUseCase } from './import-supplier-products.usecase';

const SUPPLIER_PRODUCT_MOCK: SupplierProduct = {
  productId: 1,
  productCode: 'PROD001',
  productName: 'Test Product',
  categoryName: null,
  supplierPrice: 100.50
};

class MockSupplierProductRepository implements SupplierProductRepository {
  getSupplierProducts = vi.fn();
  addProductToSupplier = vi.fn();
  updateSupplierProductPrice = vi.fn();
  removeProductFromSupplier = vi.fn();
  importSupplierProducts = vi.fn();
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
      const supplierId = 1;
      const expectedProducts = [SUPPLIER_PRODUCT_MOCK];
      repo.getSupplierProducts.mockReturnValue(of(expectedProducts));

      const result = await firstValueFrom(getSupplierProductsUseCase.execute(supplierId));

      expect(repo.getSupplierProducts).toHaveBeenCalledWith(supplierId);
      expect(result).toEqual(expectedProducts);
    });

    it('should throw ValidationError if supplierId is invalid', () => {
      expect(() => getSupplierProductsUseCase.execute(0)).toThrow(SupplierProductValidationError);
      expect(() => getSupplierProductsUseCase.execute(-1)).toThrow(SupplierProductValidationError);
    });

    it('should propagate repository errors', async () => {
      const supplierId = 1;
      const errorMessage = 'Repository error';
      repo.getSupplierProducts.mockReturnValue(throwError(() => new Error(errorMessage)));

      await expect(firstValueFrom(getSupplierProductsUseCase.execute(supplierId))).rejects.toThrow(errorMessage);
    });
  });

  describe('AddProductToSupplierUseCase', () => {
    it('should delegate to repository', async () => {
      const supplierId = 1;
      const request: AddSupplierProductRequest = {
        productId: 1,
        supplierPrice: 100.50
      };
      repo.addProductToSupplier.mockReturnValue(of(SUPPLIER_PRODUCT_MOCK));

      await firstValueFrom(addProductToSupplierUseCase.execute(supplierId, request));

      expect(repo.addProductToSupplier).toHaveBeenCalledWith(supplierId, request);
    });

    it('should throw ValidationError if inputs are invalid', () => {
      const validRequest: AddSupplierProductRequest = { productId: 1, supplierPrice: 10 };
      expect(() => addProductToSupplierUseCase.execute(0, validRequest)).toThrow(SupplierProductValidationError);
      
      const invalidProductRequest: AddSupplierProductRequest = { productId: 0, supplierPrice: 10 };
      expect(() => addProductToSupplierUseCase.execute(1, invalidProductRequest)).toThrow(SupplierProductValidationError);
      
      const invalidPriceRequest: AddSupplierProductRequest = { productId: 1, supplierPrice: 0 };
      expect(() => addProductToSupplierUseCase.execute(1, invalidPriceRequest)).toThrow(SupplierProductValidationError);
    });

    it('should propagate repository errors', async () => {
      const supplierId = 1;
      const request: AddSupplierProductRequest = {
        productId: 1,
        supplierPrice: 100.50
      };
      const errorMessage = 'Repository error';
      repo.addProductToSupplier.mockReturnValue(throwError(() => new Error(errorMessage)));

      await expect(firstValueFrom(addProductToSupplierUseCase.execute(supplierId, request))).rejects.toThrow(errorMessage);
    });
  });

  describe('UpdateSupplierProductPriceUseCase', () => {
    it('should delegate to repository', async () => {
      const supplierId = 1;
      const productId = 1;
      const request: UpdateSupplierProductPriceRequest = {
        supplierPrice: 150.75
      };
      repo.updateSupplierProductPrice.mockReturnValue(of(SUPPLIER_PRODUCT_MOCK));

      await firstValueFrom(updateSupplierProductPriceUseCase.execute(supplierId, productId, request));

      expect(repo.updateSupplierProductPrice).toHaveBeenCalledWith(supplierId, productId, request);
    });

    it('should throw ValidationError if inputs are invalid', () => {
      const request: UpdateSupplierProductPriceRequest = { supplierPrice: 10 };
      expect(() => updateSupplierProductPriceUseCase.execute(0, 1, request)).toThrow(SupplierProductValidationError);
      expect(() => updateSupplierProductPriceUseCase.execute(1, 0, request)).toThrow(SupplierProductValidationError);
      
      const invalidPriceRequest: UpdateSupplierProductPriceRequest = { supplierPrice: 0 };
      expect(() => updateSupplierProductPriceUseCase.execute(1, 1, invalidPriceRequest)).toThrow(SupplierProductValidationError);
    });

    it('should propagate repository errors', async () => {
      const supplierId = 1;
      const productId = 1;
      const request: UpdateSupplierProductPriceRequest = {
        supplierPrice: 150.75
      };
      const errorMessage = 'Repository error';
      repo.updateSupplierProductPrice.mockReturnValue(throwError(() => new Error(errorMessage)));

      await expect(firstValueFrom(updateSupplierProductPriceUseCase.execute(supplierId, productId, request))).rejects.toThrow(errorMessage);
    });
  });

  describe('RemoveProductFromSupplierUseCase', () => {
    it('should delegate to repository', async () => {
      const supplierId = 1;
      const productId = 1;
      repo.removeProductFromSupplier.mockReturnValue(of(undefined));

      await firstValueFrom(removeProductFromSupplierUseCase.execute(supplierId, productId));

      expect(repo.removeProductFromSupplier).toHaveBeenCalledWith(supplierId, productId);
    });

    it('should throw ValidationError if IDs are invalid', () => {
      expect(() => removeProductFromSupplierUseCase.execute(0, 1)).toThrow(SupplierProductValidationError);
      expect(() => removeProductFromSupplierUseCase.execute(1, 0)).toThrow(SupplierProductValidationError);
    });

    it('should propagate repository errors', async () => {
      const supplierId = 1;
      const productId = 1;
      const errorMessage = 'Repository error';
      repo.removeProductFromSupplier.mockReturnValue(throwError(() => new Error(errorMessage)));

      await expect(firstValueFrom(removeProductFromSupplierUseCase.execute(supplierId, productId))).rejects.toThrow(errorMessage);
    });
  });

  describe('ImportSupplierProductsUseCase', () => {
    it('should delegate to repository', async () => {
      const supplierId = 1;
      const mockFile = new File([''], 'test.xlsx');
      const request: ImportSupplierProductsRequest = {
        file: mockFile
      };
      const importResult: ImportResult = { total: 2, created: 2, errors: 0, error_detail: [] };
      repo.importSupplierProducts.mockReturnValue(of(importResult));

      const result = await firstValueFrom(importSupplierProductsUseCase.execute(supplierId, request));

      expect(repo.importSupplierProducts).toHaveBeenCalledWith(supplierId, request);
      expect(result).toEqual(importResult);
    });

    it('should throw ValidationError if inputs are invalid', () => {
      const validRequest: ImportSupplierProductsRequest = { file: new File([], 'test.xlsx') };
      expect(() => importSupplierProductsUseCase.execute(0, validRequest)).toThrow(SupplierProductValidationError);
      
      const invalidFileRequest = { file: null } as unknown as ImportSupplierProductsRequest;
      expect(() => importSupplierProductsUseCase.execute(1, invalidFileRequest)).toThrow(SupplierProductValidationError);
    });

    it('should propagate repository errors', async () => {
      const supplierId = 1;
      const mockFile = new File([''], 'test.xlsx');
      const request: ImportSupplierProductsRequest = {
        file: mockFile
      };
      const errorMessage = 'Repository error';
      repo.importSupplierProducts.mockReturnValue(throwError(() => new Error(errorMessage)));

      await expect(firstValueFrom(importSupplierProductsUseCase.execute(supplierId, request))).rejects.toThrow(errorMessage);
    });
  });
});

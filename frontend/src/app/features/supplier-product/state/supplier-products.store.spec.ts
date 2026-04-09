import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import {
  AddSupplierProductRequest,
  ImportResult,
  ImportSupplierProductsRequest,
  PagedResult,
  SupplierProduct,
  SupplierProductQueryParams,
} from '@domain/models/supplier-product.model';
import { AddProductToSupplierUseCase } from '@domain/usecases/supplier-product/add-product-to-supplier.usecase';
import { DownloadTemplateUseCase } from '@domain/usecases/supplier-product/download-template.usecase';
import { GetSupplierProductsUseCase } from '@domain/usecases/supplier-product/get-supplier-products.usecase';
import { ImportSupplierProductsUseCase } from '@domain/usecases/supplier-product/import-supplier-products.usecase';
import { RemoveProductFromSupplierUseCase } from '@domain/usecases/supplier-product/remove-product-from-supplier.usecase';
import { UpdateSupplierProductPriceUseCase } from '@domain/usecases/supplier-product/update-supplier-product-price.usecase';
import { SupplierProductsStore } from '@features/supplier-product/state/supplier-products.store';

const SUPPLIER_PRODUCT_A: SupplierProduct = {
  productId: 1,
  productCode: 'PRD001',
  productName: 'Producto 1',
  categoryName: 'Categoria',
  supplierPrice: 10,
};

const SUPPLIER_PRODUCT_B: SupplierProduct = {
  productId: 2,
  productCode: 'PRD002',
  productName: 'Producto 2',
  categoryName: 'Categoria',
  supplierPrice: 20,
};

class MockAuthService {
  readonly user = signal({
    uid: 'uid-1',
    email: 'admin@example.com',
    displayName: 'Admin',
    photoURL: null,
    role: 'Administrator' as const,
  });
}

class MockGetSupplierProductsUseCase {
  execute = vi.fn<(supplierId: number, params?: SupplierProductQueryParams) => unknown>();
}

class MockAddProductToSupplierUseCase {
  execute = vi.fn<(supplierId: number, request: AddSupplierProductRequest) => unknown>();
}

class MockUpdateSupplierProductPriceUseCase {
  execute = vi.fn();
}

class MockRemoveProductFromSupplierUseCase {
  execute = vi.fn();
}

class MockImportSupplierProductsUseCase {
  execute = vi.fn<(supplierId: number, request: ImportSupplierProductsRequest) => unknown>();
}

class MockDownloadTemplateUseCase {
  execute = vi.fn<(supplierId: number) => unknown>();
}

describe('SupplierProductsStore', () => {
  let store: SupplierProductsStore;
  let getSupplierProductsUseCase: MockGetSupplierProductsUseCase;
  let addProductToSupplierUseCase: MockAddProductToSupplierUseCase;
  let importSupplierProductsUseCase: MockImportSupplierProductsUseCase;
  let downloadTemplateUseCase: MockDownloadTemplateUseCase;

  beforeEach(() => {
    getSupplierProductsUseCase = new MockGetSupplierProductsUseCase();
    addProductToSupplierUseCase = new MockAddProductToSupplierUseCase();
    importSupplierProductsUseCase = new MockImportSupplierProductsUseCase();
    downloadTemplateUseCase = new MockDownloadTemplateUseCase();

    TestBed.configureTestingModule({
      providers: [
        SupplierProductsStore,
        { provide: AuthService, useValue: new MockAuthService() },
        { provide: GetSupplierProductsUseCase, useValue: getSupplierProductsUseCase },
        { provide: AddProductToSupplierUseCase, useValue: addProductToSupplierUseCase },
        { provide: UpdateSupplierProductPriceUseCase, useValue: new MockUpdateSupplierProductPriceUseCase() },
        { provide: RemoveProductFromSupplierUseCase, useValue: new MockRemoveProductFromSupplierUseCase() },
        { provide: ImportSupplierProductsUseCase, useValue: importSupplierProductsUseCase },
        { provide: DownloadTemplateUseCase, useValue: downloadTemplateUseCase },
      ],
    });

    store = TestBed.inject(SupplierProductsStore);
  });

  it('carga productos de proveedor', async () => {
    const response: PagedResult<SupplierProduct> = {
      data: [SUPPLIER_PRODUCT_A, SUPPLIER_PRODUCT_B],
      total: 2,
      page: 1,
      pageSize: 10,
    };

    getSupplierProductsUseCase.execute.mockReturnValue(of(response));

    await store.loadSupplierProducts(10);

    expect(getSupplierProductsUseCase.execute).toHaveBeenCalledWith(10, { page: 1, pageSize: 10 });
    expect(store.supplierProducts()).toEqual([SUPPLIER_PRODUCT_A, SUPPLIER_PRODUCT_B]);
    expect(store.supplierTotal()).toBe(2);
    expect(store.error()).toBeNull();
  });

  it('no agrega producto si no hay supplier seleccionado', async () => {
    await store.addProductToSupplier({ productId: 5, supplierPrice: 25 });

    expect(addProductToSupplierUseCase.execute).not.toHaveBeenCalled();
    expect(store.error()).toBe('No hay proveedor seleccionado.');
  });

  it('agrega producto y recarga la lista', async () => {
    getSupplierProductsUseCase.execute
      .mockReturnValueOnce(of({ data: [SUPPLIER_PRODUCT_A], total: 1, page: 1, pageSize: 10 }))
      .mockReturnValueOnce(of({ data: [SUPPLIER_PRODUCT_A, SUPPLIER_PRODUCT_B], total: 2, page: 1, pageSize: 10 }));

    await store.loadSupplierProducts(1);

    const payload: AddSupplierProductRequest = { productId: 2, supplierPrice: 20 };
    addProductToSupplierUseCase.execute.mockReturnValue(of(SUPPLIER_PRODUCT_B));

    store.openAddProductDialog();
    await store.addProductToSupplier(payload);

    expect(addProductToSupplierUseCase.execute).toHaveBeenCalledWith(1, payload);
    expect(store.addProductDialogVisible()).toBe(false);
    expect(store.supplierProducts()).toEqual([SUPPLIER_PRODUCT_A, SUPPLIER_PRODUCT_B]);
    expect(store.supplierTotal()).toBe(2);
  });

  it('onSupplierPageChange actualiza pagina y recarga', async () => {
    getSupplierProductsUseCase.execute
      .mockReturnValueOnce(of({ data: [SUPPLIER_PRODUCT_A], total: 1, page: 1, pageSize: 10 }))
      .mockReturnValueOnce(of({ data: [SUPPLIER_PRODUCT_B], total: 1, page: 2, pageSize: 10 }));

    await store.loadSupplierProducts(1);
    store.onSupplierPageChange({ first: 10, rows: 10 });

    expect(store.supplierPage()).toBe(2);
    expect(getSupplierProductsUseCase.execute).toHaveBeenCalledTimes(2);
  });

  it('importa productos y guarda resultado', async () => {
    const file = new File(['x'], 'import.xlsx');
    const request: ImportSupplierProductsRequest = { file };
    const importResult: ImportResult = {
      total: 2,
      created: 2,
      errors: 0,
      error_detail: [],
    };

    getSupplierProductsUseCase.execute
      .mockReturnValueOnce(of({ data: [SUPPLIER_PRODUCT_A], total: 1, page: 1, pageSize: 10 }))
      .mockReturnValueOnce(of({ data: [SUPPLIER_PRODUCT_A, SUPPLIER_PRODUCT_B], total: 2, page: 1, pageSize: 10 }));

    await store.loadSupplierProducts(1);

    importSupplierProductsUseCase.execute.mockReturnValue(of(importResult));

    await store.importProducts(request);

    expect(importSupplierProductsUseCase.execute).toHaveBeenCalledWith(1, request);
    expect(store.importResult()).toEqual(importResult);
  });

  it('descarga template', async () => {
    getSupplierProductsUseCase.execute.mockReturnValue(of({ data: [SUPPLIER_PRODUCT_A], total: 1, page: 1, pageSize: 10 }));
    await store.loadSupplierProducts(1);

    const blob = new Blob([new Uint8Array([1, 2, 3])]);
    downloadTemplateUseCase.execute.mockReturnValue(of(blob));

    const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:test');
    const revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const clickSpy = vi.fn();
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickSpy,
    } as unknown as HTMLAnchorElement);
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => ({} as Node));
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => ({} as Node));

    await store.downloadTemplate();

    expect(downloadTemplateUseCase.execute).toHaveBeenCalledWith(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    createElementSpy.mockRestore();
    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });
});

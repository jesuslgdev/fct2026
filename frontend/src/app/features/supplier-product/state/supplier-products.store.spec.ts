import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { SupplierProductsStore } from './supplier-products.store';
import { AuthService } from '@core/services/auth.service';
import { UserPermission } from '@domain/enums/user-permission.enum';
import { UserRole } from '@domain/enums/user-role.enum';
import { AuthUser } from '@domain/models/auth-user.model';
import { Product } from '@domain/models/product.model';
import { ImportResult, PagedResult, SupplierProduct } from '@domain/models/supplier-product.model';
import { SupplierProductDuplicateError } from '@domain/models/supplier-product-errors';
import { GetProductsUseCase } from '@domain/usecases/product/get-products.usecase';
import { AddProductToSupplierUseCase } from '@domain/usecases/supplier-product/add-product-to-supplier.usecase';
import { DownloadTemplateUseCase } from '@domain/usecases/supplier-product/download-template.usecase';
import { GetSupplierProductsUseCase } from '@domain/usecases/supplier-product/get-supplier-products.usecase';
import { ImportSupplierProductsUseCase } from '@domain/usecases/supplier-product/import-supplier-products.usecase';
import { RemoveProductFromSupplierUseCase } from '@domain/usecases/supplier-product/remove-product-from-supplier.usecase';
import { UpdateSupplierProductPriceUseCase } from '@domain/usecases/supplier-product/update-supplier-product-price.usecase';

const SUPPLIER_PRODUCT: SupplierProduct = {
  productId: 1,
  productCode: 'PRD-001',
  productName: 'Producto test',
  categoryName: 'General',
  supplierPrice: 12.5,
};

const PRODUCT: Product = {
  productId: 1,
  code: 'PRD-001',
  name: 'Producto test',
  description: 'Producto test',
  categoryId: 1,
  categoryName: 'General',
  price: 15,
  stock: 10,
  minStock: 1,
  isActive: true,
};

const SUPPLIER_PRODUCTS_PAGE: PagedResult<SupplierProduct> = {
  data: [SUPPLIER_PRODUCT],
  total: 1,
  page: 1,
  pageSize: 10,
};

class MockAuthService {
  readonly user = signal<AuthUser | null>({
    uid: 'uid-1',
    email: 'purchases@example.com',
    displayName: 'Purchases',
    photoURL: null,
    role: UserRole.Administrator,
    permissions: [UserPermission.PurchasesManager],
  });
  readonly permissions = signal([UserPermission.PurchasesManager]);

  hasPermission(permission: UserPermission | UserPermission[]): boolean {
    const permissions = Array.isArray(permission) ? permission : [permission];
    return permissions.some((perm) => this.permissions().includes(perm));
  }
}

class MockGetSupplierProductsUseCase {
  execute = vi.fn().mockReturnValue(of(SUPPLIER_PRODUCTS_PAGE));
}

class MockAddProductToSupplierUseCase {
  execute = vi.fn().mockReturnValue(of(SUPPLIER_PRODUCT));
}

class MockUpdateSupplierProductPriceUseCase {
  execute = vi.fn().mockReturnValue(of(SUPPLIER_PRODUCT));
}

class MockRemoveProductFromSupplierUseCase {
  execute = vi.fn().mockReturnValue(of(undefined));
}

class MockGetProductsUseCase {
  execute = vi.fn().mockReturnValue(of({ data: [PRODUCT], total: 1, page: 1, pageSize: 100 }));
}

class MockImportSupplierProductsUseCase {
  execute = vi.fn().mockReturnValue(of({ total: 1, created: 1, errors: 0, errorDetail: [] }));
}

class MockDownloadTemplateUseCase {
  execute = vi.fn().mockReturnValue(of(new Blob(['test'], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })));
}

describe('SupplierProductsStore', () => {
  let store: SupplierProductsStore;
  let addProductToSupplierUseCase: MockAddProductToSupplierUseCase;
  let getSupplierProductsUseCase: MockGetSupplierProductsUseCase;
  let importSupplierProductsUseCase: MockImportSupplierProductsUseCase;
  let downloadTemplateUseCase: MockDownloadTemplateUseCase;
  let getProductsUseCase: MockGetProductsUseCase;

  beforeEach(() => {
    addProductToSupplierUseCase = new MockAddProductToSupplierUseCase();
    getSupplierProductsUseCase = new MockGetSupplierProductsUseCase();
    importSupplierProductsUseCase = new MockImportSupplierProductsUseCase();
    downloadTemplateUseCase = new MockDownloadTemplateUseCase();
    getProductsUseCase = new MockGetProductsUseCase();

    TestBed.configureTestingModule({
      providers: [
        SupplierProductsStore,
        { provide: AuthService, useClass: MockAuthService },
        { provide: GetSupplierProductsUseCase, useValue: getSupplierProductsUseCase },
        { provide: AddProductToSupplierUseCase, useValue: addProductToSupplierUseCase },
        { provide: UpdateSupplierProductPriceUseCase, useClass: MockUpdateSupplierProductPriceUseCase },
        { provide: RemoveProductFromSupplierUseCase, useClass: MockRemoveProductFromSupplierUseCase },
        { provide: ImportSupplierProductsUseCase, useValue: importSupplierProductsUseCase },
        { provide: DownloadTemplateUseCase, useValue: downloadTemplateUseCase },
        { provide: GetProductsUseCase, useValue: getProductsUseCase },
      ],
    });

    store = TestBed.inject(SupplierProductsStore);
    store.supplierId.set(1);
  });

  it('keeps the add product dialog open and stores dialog error when creating an association fails', async () => {
    addProductToSupplierUseCase.execute.mockReturnValueOnce(
      throwError(() => new SupplierProductDuplicateError()),
    );
    store.addProductDialogVisible.set(false);

    await store.addProductToSupplier({ productId: 1, supplierPrice: '12.50' });

    expect(store.addProductDialogError()).toBe('El producto ya esta asociado con este proveedor.');
    expect(store.addProductDialogVisible()).toBe(true);
    expect(store.error()).toBeNull();
  });

  it('closes the add product dialog and refreshes supplier products after creating an association', async () => {
    store.addProductDialogVisible.set(true);
    store.addProductDialogError.set('Error anterior');
    store.selectedProductId.set(1);
    store.addProductPriceDraft.set('12.50');

    await store.addSelectedProductToSupplier();

    expect(addProductToSupplierUseCase.execute).toHaveBeenCalledWith(1, { productId: 1, supplierPrice: 12.5 });
    expect(getSupplierProductsUseCase.execute).toHaveBeenCalledWith(1, { page: 1, pageSize: 10 });
    expect(store.addProductDialogVisible()).toBe(false);
    expect(store.addProductDialogError()).toBeNull();
    expect(store.selectedProductId()).toBeNull();
    expect(store.addProductPriceDraft()).toBe('');
  });

  it('writes invalid add price errors to the add product dialog error', async () => {
    store.addProductDialogVisible.set(false);

    await store.addProductToSupplier({ productId: 1, supplierPrice: '0' });

    expect(addProductToSupplierUseCase.execute).not.toHaveBeenCalled();
    expect(store.addProductDialogError()).toBe('El precio del proveedor debe ser mayor que cero.');
    expect(store.addProductDialogVisible()).toBe(true);
    expect(store.error()).toBeNull();
  });

  it('clears add product dialog error when opening and closing the dialog', () => {
    store.addProductDialogError.set('Error anterior');

    store.openAddProductDialog();

    expect(store.addProductDialogError()).toBeNull();
    expect(store.addProductDialogVisible()).toBe(true);

    store.addProductDialogError.set('Otro error');
    store.closeAddProductDialog();

    expect(store.addProductDialogError()).toBeNull();
    expect(store.addProductDialogVisible()).toBe(false);
  });

  it('translates exact import validation errors before storing the result', async () => {
    const importResult: ImportResult = {
      total: 1,
      created: 0,
      errors: 1,
      errorDetail: [{ row: 2, reason: 'Invalid price format' }],
    };
    importSupplierProductsUseCase.execute.mockReturnValueOnce(of(importResult));
    store.selectedImportFile.set(new File(['data'], 'supplier-products.xlsx'));

    await store.importSupplierProducts();

    expect(store.importResult()?.errorDetail).toEqual([
      { row: 2, reason: 'Formato de precio invalido.' },
    ]);
  });

  it('translates dynamic import validation errors before storing the result', async () => {
    const importResult: ImportResult = {
      total: 2,
      created: 0,
      errors: 2,
      errorDetail: [
        { row: 3, reason: 'Product with code PRD-404 not found' },
        { row: 4, reason: 'Association already exists for product PRD-001' },
      ],
    };
    importSupplierProductsUseCase.execute.mockReturnValueOnce(of(importResult));
    store.selectedImportFile.set(new File(['data'], 'supplier-products.xlsx'));

    await store.importSupplierProducts();

    expect(store.importResult()?.errorDetail).toEqual([
      { row: 3, reason: 'Producto con codigo PRD-404 no encontrado.' },
      { row: 4, reason: 'La asociacion ya existe para el producto PRD-001.' },
    ]);
  });

  it('keeps unknown import validation errors unchanged', async () => {
    const importResult: ImportResult = {
      total: 1,
      created: 0,
      errors: 1,
      errorDetail: [{ row: 2, reason: 'Unexpected import rule from API' }],
    };
    importSupplierProductsUseCase.execute.mockReturnValueOnce(of(importResult));
    store.selectedImportFile.set(new File(['data'], 'supplier-products.xlsx'));

    await store.importSupplierProducts();

    expect(store.importResult()?.errorDetail).toEqual([
      { row: 2, reason: 'Unexpected import rule from API' },
    ]);
  });

  it('loads template products with the current page, search and active filter', async () => {
    store.templateProductsPage.set(2);
    store.templateProductsPageSize.set(20);
    store.templateProductsSearchQuery.set('  cable  ');
    getProductsUseCase.execute.mockReturnValueOnce(of({
      data: [
        PRODUCT,
        { ...PRODUCT, productId: 2, code: 'PRD-002', isActive: false },
      ],
      total: 8,
      page: 2,
      pageSize: 20,
    }));

    await store.loadTemplateProducts();

    expect(getProductsUseCase.execute).toHaveBeenCalledWith({
      page: 2,
      pageSize: 20,
      search: 'cable',
      active: true,
    });
    expect(store.templateProducts()).toEqual([PRODUCT]);
    expect(store.templateProductsTotal()).toBe(8);
  });

  it('resets import dialog state when opening and closing the import dialog', () => {
    store.importDialogError.set('Previous import error');
    store.importResult.set({ total: 1, created: 0, errors: 1, errorDetail: [{ row: 2, reason: 'Error' }] });
    store.selectedImportFile.set(new File(['data'], 'supplier-products.xlsx'));
    store.selectedTemplateProductIds.set(new Set([1, 2]));
    store.templateProductsSearchQuery.set('query');

    store.openImportDialog();

    expect(store.importDialogVisible()).toBe(true);
    expect(store.importDialogError()).toBeNull();
    expect(store.importResult()).toBeNull();
    expect(store.selectedImportFile()).toBeNull();
    expect(store.selectedTemplateProductIds().size).toBe(0);
    expect(store.templateProductsSearchQuery()).toBe('');

    store.importDialogError.set('Another import error');
    store.closeImportDialog();

    expect(store.importDialogVisible()).toBe(false);
    expect(store.importDialogError()).toBeNull();
    expect(store.selectedTemplateProductIds().size).toBe(0);
  });

  it('does not select template products that are already associated', () => {
    store.supplierProducts.set([SUPPLIER_PRODUCT]);

    store.setTemplateProductSelected(1, true);
    store.setTemplateProductSelected(2, true);

    expect(store.selectedTemplateProductIds()).toEqual(new Set([2]));
  });

  it('toggles only visible selectable template products', () => {
    store.supplierProducts.set([SUPPLIER_PRODUCT]);
    store.templateProducts.set([
      PRODUCT,
      { ...PRODUCT, productId: 2, code: 'PRD-002', name: 'Otro' },
      { ...PRODUCT, productId: 3, code: 'PRD-003', name: 'Tercero' },
    ]);

    store.toggleAllVisibleTemplateProducts(true);

    expect(store.selectedTemplateProductIds()).toEqual(new Set([2, 3]));

    store.toggleAllVisibleTemplateProducts(false);

    expect(store.selectedTemplateProductIds().size).toBe(0);
  });

  it('downloads the template with only non-associated selected product ids', async () => {
    const blob = new Blob(['xlsx'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadTemplateUseCase.execute.mockReturnValueOnce(of(blob));
    store.supplierProducts.set([SUPPLIER_PRODUCT]);
    store.selectedTemplateProductIds.set(new Set([1, 2, 3]));

    const result = await store.downloadTemplate();

    expect(downloadTemplateUseCase.execute).toHaveBeenCalledWith(1, { productIds: [2, 3] });
    expect(result).toBe(blob);
    expect(store.templateDownloadLoading()).toBe(false);
  });

  it('refreshes supplier products and template products after a successful import', async () => {
    importSupplierProductsUseCase.execute.mockReturnValueOnce(of({
      total: 2,
      created: 2,
      errors: 0,
      errorDetail: [],
    }));
    store.selectedImportFile.set(new File(['data'], 'supplier-products.xlsx'));
    store.selectedTemplateProductIds.set(new Set([2, 3]));

    await store.importSupplierProducts();

    expect(importSupplierProductsUseCase.execute).toHaveBeenCalledWith(1, {
      file: expect.any(File),
    });
    expect(getSupplierProductsUseCase.execute).toHaveBeenCalledWith(1, { page: 1, pageSize: 10 });
    expect(getProductsUseCase.execute).toHaveBeenCalledWith({ page: 1, pageSize: 10, active: true });
    expect(store.selectedTemplateProductIds().size).toBe(0);
    expect(store.importSucceeded()).toBe(true);
  });

  it('rejects non-xlsx files before trying to import', async () => {
    store.selectedImportFile.set(new File(['data'], 'supplier-products.csv'));

    await store.importSupplierProducts();

    expect(importSupplierProductsUseCase.execute).not.toHaveBeenCalled();
    expect(store.importDialogError()).toBe('El archivo debe ser Excel .xlsx.');
  });
});

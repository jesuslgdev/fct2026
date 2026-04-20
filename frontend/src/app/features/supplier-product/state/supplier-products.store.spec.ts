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

  beforeEach(() => {
    addProductToSupplierUseCase = new MockAddProductToSupplierUseCase();
    getSupplierProductsUseCase = new MockGetSupplierProductsUseCase();
    importSupplierProductsUseCase = new MockImportSupplierProductsUseCase();

    TestBed.configureTestingModule({
      providers: [
        SupplierProductsStore,
        { provide: AuthService, useClass: MockAuthService },
        { provide: GetSupplierProductsUseCase, useValue: getSupplierProductsUseCase },
        { provide: AddProductToSupplierUseCase, useValue: addProductToSupplierUseCase },
        { provide: UpdateSupplierProductPriceUseCase, useClass: MockUpdateSupplierProductPriceUseCase },
        { provide: RemoveProductFromSupplierUseCase, useClass: MockRemoveProductFromSupplierUseCase },
        { provide: ImportSupplierProductsUseCase, useValue: importSupplierProductsUseCase },
        { provide: DownloadTemplateUseCase, useClass: MockDownloadTemplateUseCase },
        { provide: GetProductsUseCase, useClass: MockGetProductsUseCase },
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
});

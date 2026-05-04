import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '@core/services/auth.service';
import { UserPermission } from '@domain/enums/user-permission.enum';
import { UserRole } from '@domain/enums/user-role.enum';
import { AuthUser } from '@domain/models/auth-user.model';
import { Product } from '@domain/models/product.model';
import {
  SupplierProductApiError,
  SupplierProductDuplicateError,
  SupplierProductForbiddenError,
  SupplierProductNotFoundError,
  SupplierProductUnauthorizedError,
  SupplierProductValidationError,
} from '@domain/models/supplier-product-errors';
import {
  ImportResult,
  PagedResult,
  SupplierProduct,
  SupplierProductQueryParams,
} from '@domain/models/supplier-product.model';
import { GetProductsUseCase } from '@domain/usecases/product/get-products.usecase';
import { AddProductToSupplierUseCase } from '@domain/usecases/supplier-product/add-product-to-supplier.usecase';
import { DownloadTemplateUseCase } from '@domain/usecases/supplier-product/download-template.usecase';
import { GetSupplierProductsUseCase } from '@domain/usecases/supplier-product/get-supplier-products.usecase';
import { ImportSupplierProductsUseCase } from '@domain/usecases/supplier-product/import-supplier-products.usecase';
import { RemoveProductFromSupplierUseCase } from '@domain/usecases/supplier-product/remove-product-from-supplier.usecase';
import { UpdateSupplierProductPriceUseCase } from '@domain/usecases/supplier-product/update-supplier-product-price.usecase';
import { SupplierProductsStore } from './supplier-products.store';

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
  readonly hasPermission = vi.fn<(permission: UserPermission | UserPermission[]) => boolean>();

  constructor() {
    this.hasPermission.mockImplementation((permission) => {
      const permissions = Array.isArray(permission) ? permission : [permission];
      return permissions.some((perm) => this.permissions().includes(perm));
    });
  }
}

class MockGetSupplierProductsUseCase {
  execute = vi.fn<
    (supplierId: number, params?: SupplierProductQueryParams) => Observable<PagedResult<SupplierProduct>>
  >();
}

class MockAddProductToSupplierUseCase {
  execute = vi.fn<
    (supplierId: number, request: { productId: number; supplierPrice: number }) => Observable<SupplierProduct>
  >();
}

class MockUpdateSupplierProductPriceUseCase {
  execute = vi.fn<
    (supplierId: number, productId: number, request: { supplierPrice: number }) => Observable<SupplierProduct>
  >();
}

class MockRemoveProductFromSupplierUseCase {
  execute = vi.fn<(supplierId: number, productId: number) => Observable<void>>();
}

class MockGetProductsUseCase {
  execute = vi.fn<
    (params: { page: number; pageSize: number; active: boolean; search?: string }) => Observable<PagedResult<Product>>
  >();
}

class MockImportSupplierProductsUseCase {
  execute = vi.fn<(supplierId: number, request: { file: File }) => Observable<ImportResult>>();
}

class MockDownloadTemplateUseCase {
  execute = vi.fn<(supplierId: number, request?: { productIds?: number[] }) => Observable<Blob>>();
}

const MOCK_SUPPLIER_PRODUCT: SupplierProduct = {
  productId: 1,
  productCode: 'P-001',
  productName: 'Producto A',
  categoryName: 'Categoria',
  supplierPrice: 10.5,
};

const MOCK_OTHER_SUPPLIER_PRODUCT: SupplierProduct = {
  productId: 2,
  productCode: 'P-002',
  productName: 'Producto B',
  categoryName: 'Categoria',
  supplierPrice: 7.25,
};

const MOCK_ACTIVE_PRODUCT: Product = {
  productId: 3,
  code: 'P-003',
  name: 'Producto C',
  description: 'Activo',
  categoryId: 10,
  categoryName: 'Categoria',
  price: 15,
  stock: 12,
  minStock: 3,
  isActive: true,
};

const MOCK_INACTIVE_PRODUCT: Product = {
  productId: 4,
  code: 'P-004',
  name: 'Producto D',
  description: 'Inactivo',
  categoryId: 10,
  categoryName: 'Categoria',
  price: 12,
  stock: 0,
  minStock: 1,
  isActive: false,
};

describe('SupplierProductsStore', () => {
  let store: SupplierProductsStore;
  let authService: MockAuthService;
  let getSupplierProductsUseCase: MockGetSupplierProductsUseCase;
  let addProductToSupplierUseCase: MockAddProductToSupplierUseCase;
  let updateSupplierProductPriceUseCase: MockUpdateSupplierProductPriceUseCase;
  let removeProductFromSupplierUseCase: MockRemoveProductFromSupplierUseCase;
  let getProductsUseCase: MockGetProductsUseCase;
  let importSupplierProductsUseCase: MockImportSupplierProductsUseCase;
  let downloadTemplateUseCase: MockDownloadTemplateUseCase;

  const supplierProductsResult: PagedResult<SupplierProduct> = {
    data: [MOCK_SUPPLIER_PRODUCT, MOCK_OTHER_SUPPLIER_PRODUCT],
    total: 2,
    page: 1,
    pageSize: 10,
  };

  const productsResult: PagedResult<Product> = {
    data: [MOCK_ACTIVE_PRODUCT, MOCK_INACTIVE_PRODUCT],
    total: 2,
    page: 1,
    pageSize: 100,
  };

  beforeEach(() => {
    authService = new MockAuthService();
    getSupplierProductsUseCase = new MockGetSupplierProductsUseCase();
    addProductToSupplierUseCase = new MockAddProductToSupplierUseCase();
    updateSupplierProductPriceUseCase = new MockUpdateSupplierProductPriceUseCase();
    removeProductFromSupplierUseCase = new MockRemoveProductFromSupplierUseCase();
    getProductsUseCase = new MockGetProductsUseCase();
    importSupplierProductsUseCase = new MockImportSupplierProductsUseCase();
    downloadTemplateUseCase = new MockDownloadTemplateUseCase();

    getSupplierProductsUseCase.execute.mockReturnValue(of(supplierProductsResult));
    getProductsUseCase.execute.mockReturnValue(of(productsResult));

    TestBed.configureTestingModule({
      providers: [
        SupplierProductsStore,
        { provide: AuthService, useValue: authService },
        { provide: GetSupplierProductsUseCase, useValue: getSupplierProductsUseCase },
        { provide: AddProductToSupplierUseCase, useValue: addProductToSupplierUseCase },
        { provide: UpdateSupplierProductPriceUseCase, useValue: updateSupplierProductPriceUseCase },
        { provide: RemoveProductFromSupplierUseCase, useValue: removeProductFromSupplierUseCase },
        { provide: GetProductsUseCase, useValue: getProductsUseCase },
        { provide: ImportSupplierProductsUseCase, useValue: importSupplierProductsUseCase },
        { provide: DownloadTemplateUseCase, useValue: downloadTemplateUseCase },
      ],
    });

    store = TestBed.inject(SupplierProductsStore);
  });

  it('should initialize default values', () => {
    expect(store.supplierProducts()).toEqual([]);
    expect(store.supplierId()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.importDialogVisible()).toBe(false);
    expect(store.selectedImportFile()).toBeNull();
    expect(store.templateDownloadLoading()).toBe(false);
  });

  it('should load supplier products and clear loading', async () => {
    await store.loadSupplierProducts(7);

    expect(getSupplierProductsUseCase.execute).toHaveBeenCalledWith(7, { page: 1, pageSize: 10 });
    expect(store.supplierId()).toBe(7);
    expect(store.supplierProducts()).toEqual(supplierProductsResult.data);
    expect(store.supplierTotal()).toBe(2);
    expect(store.loading()).toBe(false);
  });

  it('should translate validation errors even without a trailing period', async () => {
    const error = new SupplierProductValidationError({}, 'Page size must be between 1 and 100');
    getSupplierProductsUseCase.execute.mockReturnValueOnce(throwError(() => error));

    await store.loadSupplierProducts(7);

    expect(store.error()).toBe('El tamano de pagina debe estar entre 1 y 100.');
  });

  it('should block modifications when the user does not have permissions', () => {
    authService.permissions.set([]);

    expect(store.canModify()).toBe(false);
  });

  it('should open the add dialog and load active products', () => {
    const loadSpy = vi.spyOn(store, 'loadActiveProductsForAdd').mockResolvedValue();

    store.openAddProductDialog();

    expect(store.addProductDialogVisible()).toBe(true);
    expect(loadSpy).toHaveBeenCalledOnce();
  });

  it('should normalize comma to dot and reload after adding', async () => {
    store.supplierId.set(5);
    store.selectedProductId.set(3);
    store.addProductPriceDraft.set('10,50');
    addProductToSupplierUseCase.execute.mockReturnValueOnce(of(MOCK_SUPPLIER_PRODUCT));

    await store.addSelectedProductToSupplier();

    expect(addProductToSupplierUseCase.execute).toHaveBeenCalledWith(5, { productId: 3, supplierPrice: 10.5 });
    expect(getSupplierProductsUseCase.execute).toHaveBeenCalledWith(5, { page: 1, pageSize: 10 });
    expect(store.addProductDialogVisible()).toBe(false);
  });

  it('should keep the add product dialog open on duplicate errors', async () => {
    store.supplierId.set(5);
    addProductToSupplierUseCase.execute.mockReturnValueOnce(
      throwError(() => new SupplierProductDuplicateError()),
    );

    await store.addProductToSupplier({ productId: 3, supplierPrice: '12.50' });

    expect(store.addProductDialogError()).toBe('El producto ya esta asociado con este proveedor.');
    expect(store.addProductDialogVisible()).toBe(true);
  });

  it('should save inline price and clear saving ids', async () => {
    store.supplierId.set(5);
    store.startInlinePriceEdit(MOCK_SUPPLIER_PRODUCT);
    store.setPriceDraft('12,40');
    updateSupplierProductPriceUseCase.execute.mockImplementationOnce(() =>
      new Observable((subscriber) => {
        expect(store.savingProductIds().has(1)).toBe(true);
        subscriber.next(MOCK_SUPPLIER_PRODUCT);
        subscriber.complete();
      }),
    );

    await store.saveInlinePrice(MOCK_SUPPLIER_PRODUCT);

    expect(updateSupplierProductPriceUseCase.execute).toHaveBeenCalledWith(5, 1, { supplierPrice: 12.4 });
    expect(store.savingProductIds().size).toBe(0);
  });

  it('should translate unauthorized error during inline save', async () => {
    store.supplierId.set(5);
    store.setPriceDraft('12.40');
    updateSupplierProductPriceUseCase.execute.mockReturnValueOnce(
      throwError(() => new SupplierProductUnauthorizedError()),
    );

    await store.saveInlinePrice(MOCK_SUPPLIER_PRODUCT);

    expect(store.error()).toBe('Su sesion ha expirado. Por favor, inicie sesion nuevamente.');
  });

  it('should delete and reload data', async () => {
    store.supplierId.set(5);
    store.requestDeleteProduct(MOCK_SUPPLIER_PRODUCT);
    removeProductFromSupplierUseCase.execute.mockReturnValueOnce(of(void 0));

    await store.confirmDeleteProduct();

    expect(removeProductFromSupplierUseCase.execute).toHaveBeenCalledWith(5, 1);
    expect(getSupplierProductsUseCase.execute).toHaveBeenCalledWith(5, { page: 1, pageSize: 10 });
  });

  it('should open and reset import dialog state', () => {
    const loadTemplateProductsSpy = vi.spyOn(store, 'loadTemplateProducts').mockResolvedValue();
    store.importDialogError.set('Error previo');
    store.selectedImportFile.set(new File(['data'], 'supplier-products.xlsx'));
    store.selectedTemplateProductIds.set(new Set([1, 2]));

    store.openImportDialog();

    expect(store.importDialogVisible()).toBe(true);
    expect(store.importDialogError()).toBeNull();
    expect(store.selectedImportFile()).toBeNull();
    expect(store.selectedTemplateProductIds().size).toBe(0);
    expect(loadTemplateProductsSpy).toHaveBeenCalledOnce();
  });

  it('should load template products with search and active filter', async () => {
    store.templateProductsPage.set(2);
    store.templateProductsPageSize.set(20);
    store.templateProductsSearchQuery.set('  cable  ');
    getProductsUseCase.execute.mockReturnValueOnce(of({
      data: [MOCK_ACTIVE_PRODUCT, MOCK_INACTIVE_PRODUCT],
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
    expect(store.templateProducts()).toEqual([MOCK_ACTIVE_PRODUCT]);
  });

  it('should not select template products that are already associated', () => {
    store.supplierProducts.set([MOCK_SUPPLIER_PRODUCT]);

    store.setTemplateProductSelected(1, true);
    store.setTemplateProductSelected(3, true);

    expect(store.selectedTemplateProductIds()).toEqual(new Set([3]));
  });

  it('should send only unassociated product ids when downloading a template', async () => {
    const blob = new Blob(['xlsx'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    downloadTemplateUseCase.execute.mockReturnValueOnce(of(blob));
    store.supplierId.set(1);
    store.supplierProducts.set([MOCK_SUPPLIER_PRODUCT]);
    store.selectedTemplateProductIds.set(new Set([1, 3]));

    const result = await store.downloadTemplate();

    expect(downloadTemplateUseCase.execute).toHaveBeenCalledWith(1, { productIds: [3] });
    expect(result).toBe(blob);
  });

  it('should translate import errors before storing the result', async () => {
    store.supplierId.set(1);
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

  it('should clear template selection and refresh data after a successful import', async () => {
    store.supplierId.set(1);
    store.selectedImportFile.set(new File(['data'], 'supplier-products.xlsx'));
    store.selectedTemplateProductIds.set(new Set([3]));
    importSupplierProductsUseCase.execute.mockReturnValueOnce(of({
      total: 2,
      created: 2,
      errors: 0,
      errorDetail: [],
    }));
    getProductsUseCase.execute.mockReturnValueOnce(of({
      data: [MOCK_ACTIVE_PRODUCT],
      total: 1,
      page: 1,
      pageSize: 10,
    }));

    await store.importSupplierProducts();

    expect(getSupplierProductsUseCase.execute).toHaveBeenCalledWith(1, { page: 1, pageSize: 10 });
    expect(store.selectedTemplateProductIds().size).toBe(0);
    expect(store.importSucceeded()).toBe(true);
  });

  it('should reject non-xlsx files before trying to import', async () => {
    store.supplierId.set(1);
    store.selectedImportFile.set(new File(['data'], 'supplier-products.csv'));

    await store.importSupplierProducts();

    expect(importSupplierProductsUseCase.execute).not.toHaveBeenCalled();
    expect(store.importDialogError()).toBe('El archivo debe ser Excel .xlsx.');
  });

  it('should use API error message when loading active products fails', async () => {
    getProductsUseCase.execute.mockReturnValueOnce(throwError(() => new SupplierProductApiError('API caida')));

    await store.loadActiveProductsForAdd();

    expect(store.addProductDialogError()).toBe('API caida');
  });

  it('should translate forbidden error in main loading', async () => {
    getSupplierProductsUseCase.execute.mockReturnValueOnce(
      throwError(() => new SupplierProductForbiddenError()),
    );

    await store.loadSupplierProducts(3);

    expect(store.error()).toBe('No tiene permisos para realizar esta accion.');
  });
});

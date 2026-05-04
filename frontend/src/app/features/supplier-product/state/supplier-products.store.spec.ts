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
});

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
  execute = vi.fn<
    (supplierId: number, request: { file: File }) => Observable<ImportResult>
  >();
}

class MockDownloadTemplateUseCase {
  execute = vi.fn<
    (supplierId: number, request?: { productIds: number[] }) => Observable<Blob>
  >();
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
    addProductToSupplierUseCase.execute.mockReturnValue(of(MOCK_SUPPLIER_PRODUCT));
    updateSupplierProductPriceUseCase.execute.mockReturnValue(of(MOCK_SUPPLIER_PRODUCT));
    removeProductFromSupplierUseCase.execute.mockReturnValue(of(void 0));
    getProductsUseCase.execute.mockReturnValue(of(productsResult));
    importSupplierProductsUseCase.execute.mockReturnValue(
      of({ total: 1, created: 1, errors: 0, errorDetail: [] }),
    );
    downloadTemplateUseCase.execute.mockReturnValue(
      of(
        new Blob(['test'], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      ),
    );

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

  describe('initial state and computed properties', () => {
    it('should initialize default values', () => {
      expect(store.supplierProducts()).toEqual([]);
      expect(store.supplierId()).toBeNull();
      expect(store.supplierTotal()).toBe(0);
      expect(store.supplierPage()).toBe(1);
      expect(store.supplierPageSize()).toBe(10);
      expect(store.loading()).toBe(false);
      expect(store.productsLoading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.addProductDialogError()).toBeNull();
      expect(store.addProductDialogVisible()).toBe(false);
      expect(store.confirmDeleteProductDialogVisible()).toBe(false);
      expect(store.editingProductId()).toBeNull();
      expect(store.savingProductIds().size).toBe(0);
    });

    it('should calculate total pages and allow modifications when user has permissions', () => {
      store.supplierTotal.set(21);
      store.supplierPageSize.set(10);

      expect(store.canModify()).toBe(true);
      expect(store.supplierTotalPages()).toBe(3);
    });

    it('should block modifications when the user does not have permissions', () => {
      authService.permissions.set([]);

      expect(store.canModify()).toBe(false);
    });

    it('should filter activeProductsForAdd to only active, unassociated products', () => {
      store.supplierProducts.set([MOCK_SUPPLIER_PRODUCT]);
      store.activeProducts.set([
        { ...MOCK_ACTIVE_PRODUCT, productId: 1 },
        MOCK_ACTIVE_PRODUCT,
        MOCK_INACTIVE_PRODUCT,
      ]);

      expect(store.activeProductsForAdd()).toEqual([MOCK_ACTIVE_PRODUCT]);
    });
  });

  describe('data loading', () => {
    it('should load supplier products and clear loading', async () => {
      await store.loadSupplierProducts(7);

      expect(getSupplierProductsUseCase.execute).toHaveBeenCalledWith(7, { page: 1, pageSize: 10 });
      expect(store.supplierId()).toBe(7);
      expect(store.supplierProducts()).toEqual(supplierProductsResult.data);
      expect(store.supplierTotal()).toBe(2);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('should translate validation errors even when they arrive without a trailing period', async () => {
      const error = new SupplierProductValidationError({}, 'Page size must be between 1 and 100');
      getSupplierProductsUseCase.execute.mockReturnValueOnce(throwError(() => error));

      await store.loadSupplierProducts(7);

      expect(store.error()).toBe('El tamano de pagina debe estar entre 1 y 100.');
      expect(store.loading()).toBe(false);
    });

    it('should update page and reload when pagination changes', () => {
      store.supplierId.set(9);
      const loadSpy = vi.spyOn(store, 'loadSupplierProducts').mockResolvedValue();

      store.onSupplierProductsPageChange({ first: 20, rows: 10 });

      expect(store.supplierPage()).toBe(3);
      expect(store.supplierPageSize()).toBe(10);
      expect(loadSpy).toHaveBeenCalledWith(9);
    });

    it('should load active products for add dialog', async () => {
      await store.loadActiveProductsForAdd();

      expect(getProductsUseCase.execute).toHaveBeenCalledWith({ page: 1, pageSize: 100, active: true });
      expect(store.activeProducts()).toEqual([MOCK_ACTIVE_PRODUCT]);
      expect(store.productsLoading()).toBe(false);
    });
  });

  describe('permissions and dialogs', () => {
    it('should block opening add dialog without permissions', () => {
      authService.permissions.set([]);

      store.openAddProductDialog();

      expect(store.error()).toBe('No tiene permisos para realizar esta accion.');
      expect(store.addProductDialogVisible()).toBe(false);
    });

    it('should open add dialog, reset draft and trigger products loading', () => {
      const loadSpy = vi.spyOn(store, 'loadActiveProductsForAdd').mockResolvedValue();
      store.selectedProductId.set(99);
      store.addProductPriceDraft.set('25');
      store.addProductDialogError.set('Error previo');

      store.openAddProductDialog();

      expect(store.selectedProductId()).toBeNull();
      expect(store.addProductPriceDraft()).toBe('');
      expect(store.addProductDialogError()).toBeNull();
      expect(store.addProductDialogVisible()).toBe(true);
      expect(loadSpy).toHaveBeenCalledOnce();
    });

    it('should clear add product dialog error when closing the dialog', () => {
      store.addProductDialogVisible.set(true);
      store.addProductDialogError.set('Otro error');

      store.closeAddProductDialog();

      expect(store.addProductDialogError()).toBeNull();
      expect(store.addProductDialogVisible()).toBe(false);
    });

    it('should block inline edit without permissions', () => {
      authService.permissions.set([]);

      store.startInlinePriceEdit(MOCK_SUPPLIER_PRODUCT);

      expect(store.error()).toBe('No tiene permisos para realizar esta accion.');
      expect(store.editingProductId()).toBeNull();
    });

    it('should prepare delete dialog when user has permissions', () => {
      store.requestDeleteProduct(MOCK_SUPPLIER_PRODUCT);

      expect(store.selectedSupplierProduct()).toEqual(MOCK_SUPPLIER_PRODUCT);
      expect(store.confirmDeleteProductDialogVisible()).toBe(true);
    });
  });

  describe('adding products', () => {
    it('should validate that a product is selected in addSelectedProductToSupplier', async () => {
      await store.addSelectedProductToSupplier();

      expect(store.addProductDialogError()).toBe('Producto seleccionado invalido.');
      expect(store.addProductDialogVisible()).toBe(true);
      expect(store.error()).toBeNull();
      expect(addProductToSupplierUseCase.execute).not.toHaveBeenCalled();
    });

    it('should require a selected supplier before adding', async () => {
      await store.addProductToSupplier({ productId: 3, supplierPrice: '10.50' });

      expect(store.addProductDialogError()).toBe('No hay proveedor seleccionado.');
      expect(store.addProductDialogVisible()).toBe(true);
      expect(store.error()).toBeNull();
      expect(addProductToSupplierUseCase.execute).not.toHaveBeenCalled();
    });

    it('should reject price with more than two decimals in the add dialog', async () => {
      store.supplierId.set(5);

      await store.addProductToSupplier({ productId: 3, supplierPrice: '10.999' });

      expect(store.addProductDialogError()).toBe('El precio del proveedor debe tener maximo 2 decimales.');
      expect(store.addProductDialogVisible()).toBe(true);
      expect(store.error()).toBeNull();
      expect(addProductToSupplierUseCase.execute).not.toHaveBeenCalled();
      expect(store.loading()).toBe(false);
    });

    it('should keep the add product dialog open and store dialog error when creating an association fails', async () => {
      store.supplierId.set(5);
      store.addProductDialogVisible.set(false);
      addProductToSupplierUseCase.execute.mockReturnValueOnce(
        throwError(() => new SupplierProductDuplicateError()),
      );

      await store.addProductToSupplier({ productId: 1, supplierPrice: '12.50' });

      expect(store.addProductDialogError()).toBe('El producto ya esta asociado con este proveedor.');
      expect(store.addProductDialogVisible()).toBe(true);
      expect(store.error()).toBeNull();
    });

    it('should normalize comma to dot, close dialog and reload after adding', async () => {
      store.supplierId.set(5);
      store.addProductDialogVisible.set(true);
      store.addProductDialogError.set('Error anterior');
      store.selectedProductId.set(3);
      store.addProductPriceDraft.set('10,50');
      addProductToSupplierUseCase.execute.mockReturnValueOnce(of(MOCK_ACTIVE_PRODUCT as unknown as SupplierProduct));

      await store.addSelectedProductToSupplier();

      expect(addProductToSupplierUseCase.execute).toHaveBeenCalledWith(5, { productId: 3, supplierPrice: 10.5 });
      expect(getSupplierProductsUseCase.execute).toHaveBeenCalledWith(5, { page: 1, pageSize: 10 });
      expect(store.addProductDialogVisible()).toBe(false);
      expect(store.addProductDialogError()).toBeNull();
      expect(store.selectedProductId()).toBeNull();
      expect(store.addProductPriceDraft()).toBe('');
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
    });
  });

  describe('inline editing', () => {
    it('should start and cancel inline edit', () => {
      store.startInlinePriceEdit(MOCK_SUPPLIER_PRODUCT);

      expect(store.editingProductId()).toBe(1);
      expect(store.priceDraft()).toBe('10.5');

      store.cancelInlinePriceEdit();

      expect(store.editingProductId()).toBeNull();
      expect(store.priceDraft()).toBe('');
    });

    it('should save inline price and clear savingProductIds afterwards', async () => {
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
      expect(store.editingProductId()).toBeNull();
      expect(store.priceDraft()).toBe('');
      expect(store.savingProductIds().size).toBe(0);
      expect(store.error()).toBeNull();
    });

    it('should translate errors and clear savingProductIds if inline save fails', async () => {
      store.supplierId.set(5);
      store.setPriceDraft('12.40');
      updateSupplierProductPriceUseCase.execute.mockReturnValueOnce(
        throwError(() => new SupplierProductUnauthorizedError()),
      );

      await store.saveInlinePrice(MOCK_SUPPLIER_PRODUCT);

      expect(store.error()).toBe('Su sesion ha expirado. Por favor, inicie sesion nuevamente.');
      expect(store.savingProductIds().size).toBe(0);
    });
  });

  describe('deletion', () => {
    it('should require supplier and product selected before deleting', async () => {
      await store.confirmDeleteProduct();

      expect(store.error()).toBe('No hay proveedor seleccionado.');
      expect(removeProductFromSupplierUseCase.execute).not.toHaveBeenCalled();
    });

    it('should delete, close dialog and reload data', async () => {
      store.supplierId.set(5);
      store.requestDeleteProduct(MOCK_SUPPLIER_PRODUCT);

      await store.confirmDeleteProduct();

      expect(removeProductFromSupplierUseCase.execute).toHaveBeenCalledWith(5, 1);
      expect(getSupplierProductsUseCase.execute).toHaveBeenCalledWith(5, { page: 1, pageSize: 10 });
      expect(store.confirmDeleteProductDialogVisible()).toBe(false);
      expect(store.selectedSupplierProduct()).toBeNull();
      expect(store.loading()).toBe(false);
    });

    it('should translate deletion errors from backend', async () => {
      store.supplierId.set(5);
      store.requestDeleteProduct(MOCK_SUPPLIER_PRODUCT);
      removeProductFromSupplierUseCase.execute.mockReturnValueOnce(
        throwError(() => new SupplierProductNotFoundError()),
      );

      await store.confirmDeleteProduct();

      expect(store.error()).toBe('La asociacion seleccionada ya no existe.');
      expect(store.loading()).toBe(false);
    });
  });

  describe('imports and template download', () => {
    it('should translate exact import validation errors before storing the result', async () => {
      store.supplierId.set(1);
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

    it('should translate dynamic import validation errors before storing the result', async () => {
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

    it('should keep unknown import validation errors unchanged', async () => {
      store.supplierId.set(1);
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

    it('should require an Excel file before importing', async () => {
      store.supplierId.set(1);

      await store.importSupplierProducts();

      expect(store.importDialogError()).toBe('Se requiere archivo Excel para importar.');
      expect(importSupplierProductsUseCase.execute).not.toHaveBeenCalled();
    });

    it('should clear template selection and refresh data after a successful import', async () => {
      store.supplierId.set(1);
      store.selectedImportFile.set(new File(['data'], 'supplier-products.xlsx'));
      store.selectedTemplateProductIds.set(new Set([3]));

      await store.importSupplierProducts();

      expect(getSupplierProductsUseCase.execute).toHaveBeenCalledWith(1, { page: 1, pageSize: 10 });
      expect(getProductsUseCase.execute).toHaveBeenCalled();
      expect(store.selectedTemplateProductIds().size).toBe(0);
    });

    it('should send only unassociated product ids when downloading a template', async () => {
      store.supplierId.set(1);
      store.supplierProducts.set([MOCK_SUPPLIER_PRODUCT]);
      store.selectedTemplateProductIds.set(new Set([1, 3]));

      await store.downloadTemplate();

      expect(downloadTemplateUseCase.execute).toHaveBeenCalledWith(1, { productIds: [3] });
    });
  });

  describe('API and permission errors', () => {
    it('should use API error message in the add dialog when loading active products fails', async () => {
      getProductsUseCase.execute.mockReturnValueOnce(throwError(() => new SupplierProductApiError('API caida')));

      await store.loadActiveProductsForAdd();

      expect(store.addProductDialogError()).toBe('API caida');
      expect(store.productsLoading()).toBe(false);
    });

    it('should translate forbidden error in main loading', async () => {
      getSupplierProductsUseCase.execute.mockReturnValueOnce(
        throwError(() => new SupplierProductForbiddenError()),
      );

      await store.loadSupplierProducts(3);

      expect(store.error()).toBe('No tiene permisos para realizar esta accion.');
      expect(store.loading()).toBe(false);
    });
  });
});

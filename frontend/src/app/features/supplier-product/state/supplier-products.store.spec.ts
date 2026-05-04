import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '@core/services/auth.service';
import { UserPermission } from '@domain/enums/user-permission.enum';
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
  hasPermission = vi.fn<(permission: UserPermission | UserPermission[]) => boolean>();
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
    authService.hasPermission.mockReturnValue(true);
    getSupplierProductsUseCase = new MockGetSupplierProductsUseCase();
    addProductToSupplierUseCase = new MockAddProductToSupplierUseCase();
    updateSupplierProductPriceUseCase = new MockUpdateSupplierProductPriceUseCase();
    removeProductFromSupplierUseCase = new MockRemoveProductFromSupplierUseCase();
    getProductsUseCase = new MockGetProductsUseCase();
    importSupplierProductsUseCase = new MockImportSupplierProductsUseCase();
    downloadTemplateUseCase = new MockDownloadTemplateUseCase();

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
      expect(store.addProductDialogVisible()).toBe(false);
      expect(store.confirmDeleteProductDialogVisible()).toBe(false);
      expect(store.editingProductId()).toBeNull();
      expect(store.savingProductIds().size).toBe(0);
      expect(store.importDialogVisible()).toBe(false);
      expect(store.selectedImportFile()).toBeNull();
      expect(store.importResult()).toBeNull();
      expect(store.importLoading()).toBe(false);
      expect(store.templateDownloadLoading()).toBe(false);
    });

    it('should calculate total pages and allow modifications when user has permissions', () => {
      store.supplierTotal.set(21);
      store.supplierPageSize.set(10);

      expect(store.canModify()).toBe(true);
      expect(store.supplierTotalPages()).toBe(3);
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
      getSupplierProductsUseCase.execute.mockReturnValue(of(supplierProductsResult));

      await store.loadSupplierProducts(7);

      expect(getSupplierProductsUseCase.execute).toHaveBeenCalledWith(7, { page: 1, pageSize: 10 });
      expect(store.supplierId()).toBe(7);
      expect(store.supplierProducts()).toEqual(supplierProductsResult.data);
      expect(store.supplierTotal()).toBe(2);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('should translate validation errors even without a trailing period', async () => {
      const error = new SupplierProductValidationError({}, 'Page size must be between 1 and 100');
      getSupplierProductsUseCase.execute.mockReturnValue(throwError(() => error));

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
      getProductsUseCase.execute.mockReturnValue(of(productsResult));

      await store.loadActiveProductsForAdd();

      expect(getProductsUseCase.execute).toHaveBeenCalledWith({ page: 1, pageSize: 100, active: true });
      expect(store.activeProducts()).toEqual([MOCK_ACTIVE_PRODUCT]);
      expect(store.productsLoading()).toBe(false);
    });
  });

  describe('dialogs and permissions', () => {
    it('should block opening add dialog without permissions', () => {
      authService.hasPermission.mockReturnValue(false);

      store.openAddProductDialog();

      expect(store.error()).toBe('No tiene permisos para realizar esta accion.');
      expect(store.addProductDialogVisible()).toBe(false);
    });

    it('should open and reset import dialog state', () => {
      const loadTemplateProductsSpy = vi.spyOn(store, 'loadTemplateProducts').mockResolvedValue();
      store.importDialogError.set('Error previo');
      store.selectedImportFile.set(new File(['data'], 'supplier-products.xlsx'));
      store.selectedTemplateProductIds.set(new Set([1, 2]));
      store.templateProductsSearchQuery.set('query');

      store.openImportDialog();

      expect(store.importDialogVisible()).toBe(true);
      expect(store.importDialogError()).toBeNull();
      expect(store.selectedImportFile()).toBeNull();
      expect(store.selectedTemplateProductIds().size).toBe(0);
      expect(store.templateProductsSearchQuery()).toBe('');
      expect(loadTemplateProductsSpy).toHaveBeenCalledOnce();
    });

    it('should close and reset import dialog state', () => {
      store.importDialogVisible.set(true);
      store.importDialogError.set('Error previo');
      store.selectedTemplateProductIds.set(new Set([1]));

      store.closeImportDialog();

      expect(store.importDialogVisible()).toBe(false);
      expect(store.importDialogError()).toBeNull();
      expect(store.selectedTemplateProductIds().size).toBe(0);
    });
  });

  describe('adding products', () => {
    it('should validate that a product is selected in addSelectedProductToSupplier', async () => {
      await store.addSelectedProductToSupplier();

      expect(store.addProductDialogError()).toBe('Producto seleccionado invalido.');
      expect(store.addProductDialogVisible()).toBe(true);
      expect(addProductToSupplierUseCase.execute).not.toHaveBeenCalled();
    });

    it('should require a selected supplier before adding', async () => {
      await store.addProductToSupplier({ productId: 3, supplierPrice: '10.50' });

      expect(store.addProductDialogError()).toBe('No hay proveedor seleccionado.');
      expect(addProductToSupplierUseCase.execute).not.toHaveBeenCalled();
    });

    it('should normalize comma to dot, close dialog and reload after adding', async () => {
      store.supplierId.set(5);
      store.addProductDialogVisible.set(true);
      addProductToSupplierUseCase.execute.mockReturnValue(of(MOCK_ACTIVE_PRODUCT as unknown as SupplierProduct));
      getSupplierProductsUseCase.execute.mockReturnValue(of(supplierProductsResult));

      await store.addProductToSupplier({ productId: 3, supplierPrice: '10,50' });

      expect(addProductToSupplierUseCase.execute).toHaveBeenCalledWith(5, { productId: 3, supplierPrice: 10.5 });
      expect(getSupplierProductsUseCase.execute).toHaveBeenCalledWith(5, { page: 1, pageSize: 10 });
      expect(store.addProductDialogVisible()).toBe(false);
      expect(store.loading()).toBe(false);
    });

    it('should keep the add product dialog open and surface duplicate errors', async () => {
      store.supplierId.set(5);
      addProductToSupplierUseCase.execute.mockReturnValueOnce(
        throwError(() => new SupplierProductDuplicateError()),
      );

      await store.addProductToSupplier({ productId: 3, supplierPrice: '12.50' });

      expect(store.addProductDialogError()).toBe('El producto ya esta asociado con este proveedor.');
      expect(store.addProductDialogVisible()).toBe(true);
      expect(store.error()).toBeNull();
    });
  });

  describe('inline editing and deletion', () => {
    it('should save inline price and clear savingProductIds afterwards', async () => {
      store.supplierId.set(5);
      store.startInlinePriceEdit(MOCK_SUPPLIER_PRODUCT);
      store.setPriceDraft('12,40');
      updateSupplierProductPriceUseCase.execute.mockImplementation(() =>
        new Observable((subscriber) => {
          expect(store.savingProductIds().has(1)).toBe(true);
          subscriber.next(MOCK_SUPPLIER_PRODUCT);
          subscriber.complete();
        }),
      );
      getSupplierProductsUseCase.execute.mockReturnValue(of(supplierProductsResult));

      await store.saveInlinePrice(MOCK_SUPPLIER_PRODUCT);

      expect(updateSupplierProductPriceUseCase.execute).toHaveBeenCalledWith(5, 1, { supplierPrice: 12.4 });
      expect(store.editingProductId()).toBeNull();
      expect(store.savingProductIds().size).toBe(0);
      expect(store.error()).toBeNull();
    });

    it('should delete, close dialog and reload data', async () => {
      store.supplierId.set(5);
      store.requestDeleteProduct(MOCK_SUPPLIER_PRODUCT);
      removeProductFromSupplierUseCase.execute.mockReturnValue(of(void 0));
      getSupplierProductsUseCase.execute.mockReturnValue(of(supplierProductsResult));

      await store.confirmDeleteProduct();

      expect(removeProductFromSupplierUseCase.execute).toHaveBeenCalledWith(5, 1);
      expect(getSupplierProductsUseCase.execute).toHaveBeenCalledWith(5, { page: 1, pageSize: 10 });
      expect(store.confirmDeleteProductDialogVisible()).toBe(false);
      expect(store.selectedSupplierProduct()).toBeNull();
    });

    it('should translate deletion errors from backend', async () => {
      store.supplierId.set(5);
      store.requestDeleteProduct(MOCK_SUPPLIER_PRODUCT);
      removeProductFromSupplierUseCase.execute.mockReturnValue(throwError(() => new SupplierProductNotFoundError()));

      await store.confirmDeleteProduct();

      expect(store.error()).toBe('La asociacion seleccionada ya no existe.');
    });
  });

  describe('template preparation and import', () => {
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
      expect(store.templateProductsTotal()).toBe(8);
    });

    it('should not select template products that are already associated', () => {
      store.supplierProducts.set([MOCK_SUPPLIER_PRODUCT]);

      store.setTemplateProductSelected(1, true);
      store.setTemplateProductSelected(3, true);

      expect(store.selectedTemplateProductIds()).toEqual(new Set([3]));
    });

    it('should toggle only visible selectable template products', () => {
      store.supplierProducts.set([MOCK_SUPPLIER_PRODUCT]);
      store.templateProducts.set([
        { ...MOCK_ACTIVE_PRODUCT, productId: 1 },
        MOCK_ACTIVE_PRODUCT,
        { ...MOCK_ACTIVE_PRODUCT, productId: 5, code: 'P-005', name: 'Producto E' },
      ]);

      store.toggleAllVisibleTemplateProducts(true);

      expect(store.selectedTemplateProductIds()).toEqual(new Set([3, 5]));

      store.toggleAllVisibleTemplateProducts(false);

      expect(store.selectedTemplateProductIds().size).toBe(0);
    });

    it('should download the template with only non-associated selected product ids', async () => {
      const blob = new Blob(['xlsx'], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      downloadTemplateUseCase.execute.mockReturnValueOnce(of(blob));
      store.supplierId.set(1);
      store.supplierProducts.set([MOCK_SUPPLIER_PRODUCT]);
      store.selectedTemplateProductIds.set(new Set([1, 2, 3]));

      const result = await store.downloadTemplate();

      expect(downloadTemplateUseCase.execute).toHaveBeenCalledWith(1, { productIds: [2, 3] });
      expect(result).toBe(blob);
      expect(store.templateDownloadLoading()).toBe(false);
    });

    it('should translate import errors before storing the result', async () => {
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
      store.supplierId.set(1);
      store.selectedImportFile.set(new File(['data'], 'supplier-products.xlsx'));

      await store.importSupplierProducts();

      expect(store.importResult()?.errorDetail).toEqual([
        { row: 3, reason: 'Producto con codigo PRD-404 no encontrado.' },
        { row: 4, reason: 'La asociacion ya existe para el producto PRD-001.' },
      ]);
    });

    it('should refresh supplier products and template products after a successful import', async () => {
      importSupplierProductsUseCase.execute.mockReturnValueOnce(of({
        total: 2,
        created: 2,
        errors: 0,
        errorDetail: [],
      }));
      getSupplierProductsUseCase.execute.mockReturnValue(of(supplierProductsResult));
      getProductsUseCase.execute.mockReturnValue(of({
        data: [MOCK_ACTIVE_PRODUCT],
        total: 1,
        page: 1,
        pageSize: 10,
      }));
      store.supplierId.set(1);
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

    it('should reject non-xlsx files before trying to import', async () => {
      store.supplierId.set(1);
      store.selectedImportFile.set(new File(['data'], 'supplier-products.csv'));

      await store.importSupplierProducts();

      expect(importSupplierProductsUseCase.execute).not.toHaveBeenCalled();
      expect(store.importDialogError()).toBe('El archivo debe ser Excel .xlsx.');
    });
  });

  describe('error mapping', () => {
    it('should use API error message when loading active products', async () => {
      getProductsUseCase.execute.mockReturnValue(throwError(() => new SupplierProductApiError('API caida')));

      await store.loadActiveProductsForAdd();

      expect(store.addProductDialogError()).toBe('API caida');
      expect(store.addProductDialogVisible()).toBe(true);
    });

    it('should translate forbidden error in main loading', async () => {
      getSupplierProductsUseCase.execute.mockReturnValue(throwError(() => new SupplierProductForbiddenError()));

      await store.loadSupplierProducts(3);

      expect(store.error()).toBe('No tiene permisos para realizar esta accion.');
    });

    it('should translate unauthorized error during inline save', async () => {
      store.supplierId.set(5);
      store.setPriceDraft('12.40');
      updateSupplierProductPriceUseCase.execute.mockReturnValue(
        throwError(() => new SupplierProductUnauthorizedError()),
      );

      await store.saveInlinePrice(MOCK_SUPPLIER_PRODUCT);

      expect(store.error()).toBe('Su sesion ha expirado. Por favor, inicie sesion nuevamente.');
    });
  });
});

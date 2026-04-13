import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { ProductsStore } from './products.store';
import { AuthService } from '@core/services/auth.service';
import { GetProductsUseCase } from '@domain/usecases/product/get-products.usecase';
import { CreateProductUseCase } from '@domain/usecases/product/create-product.usecase';
import { UpdateProductUseCase } from '@domain/usecases/product/update-product.usecase';
import { ToggleProductStatusUseCase } from '@domain/usecases/product/toggle-product-status.usecase';
import { GetProductByIdUseCase } from '@domain/usecases/product/get-product-by-id.usecase';
import { CheckProductCodeUseCase } from '@domain/usecases/product/check-product-code.usecase';
import { GetLowStockProductsUseCase } from '@domain/usecases/product/get-low-stock-products.usecase';
import { GetProductCategoriesUseCase } from '@domain/usecases/product/get-product-categories.usecase';
import { Product, ProductCategory, CreateProductPayload, UpdateProductPayload, ProductQueryParams, PagedResult } from '@domain/models/product.model';
import { ProductValidationError } from '@domain/models/product-errors';

class MockAuthService {
  readonly user = vi.fn().mockReturnValue({
    uid: 'uid-1',
    email: 'admin@example.com',
    displayName: 'Admin',
    photoURL: null,
    role: 'Administrator' as const,
  });
}

class MockGetProductsUseCase {
  execute = vi.fn<(params: ProductQueryParams) => Observable<PagedResult<Product>>>();
}

class MockCreateProductUseCase {
  execute = vi.fn<(payload: CreateProductPayload) => Observable<Product>>();
}

class MockUpdateProductUseCase {
  execute = vi.fn<(id: number, payload: UpdateProductPayload) => Observable<Product>>();
}

class MockToggleProductStatusUseCase {
  execute = vi.fn<(id: number, active: boolean) => Observable<void>>();
}

class MockGetProductByIdUseCase {
  execute = vi.fn<(id: number) => Observable<Product>>();
}

class MockCheckProductCodeUseCase {
  execute = vi.fn<(code: string) => Observable<boolean>>();
}

class MockGetLowStockProductsUseCase {
  execute = vi.fn<() => Observable<Product[]>>();
}

class MockGetProductCategoriesUseCase {
  execute = vi.fn<() => Observable<ProductCategory[]>>();
}

describe('ProductsStore', () => {
  let store: ProductsStore;
  let authService: MockAuthService;
  let getProductsUseCase: MockGetProductsUseCase;
  let createProductUseCase: MockCreateProductUseCase;
  let updateProductUseCase: MockUpdateProductUseCase;
  let toggleProductStatusUseCase: MockToggleProductStatusUseCase;
  let getProductByIdUseCase: MockGetProductByIdUseCase;
  let checkProductCodeUseCase: MockCheckProductCodeUseCase;
  let getLowStockProductsUseCase: MockGetLowStockProductsUseCase;
  let getProductCategoriesUseCase: MockGetProductCategoriesUseCase;

  const mockProduct: Product = {
    productId: 1,
    code: 'TEST001',
    name: 'Test Product',
    description: 'Test Description',
    categoryId: 1,
    categoryName: 'Test Category',
    price: 100,
    stock: 10,
    minStock: 5,
    isActive: true,
  };

  const mockCategory: ProductCategory = {
    categoryId: 1,
    name: 'Test Category',
    description: 'Test Category Description',
  };

  beforeEach(() => {
    authService = new MockAuthService();
    getProductsUseCase = new MockGetProductsUseCase();
    createProductUseCase = new MockCreateProductUseCase();
    updateProductUseCase = new MockUpdateProductUseCase();
    toggleProductStatusUseCase = new MockToggleProductStatusUseCase();
    getProductByIdUseCase = new MockGetProductByIdUseCase();
    checkProductCodeUseCase = new MockCheckProductCodeUseCase();
    getLowStockProductsUseCase = new MockGetLowStockProductsUseCase();
    getProductCategoriesUseCase = new MockGetProductCategoriesUseCase();

    TestBed.configureTestingModule({
      providers: [
        ProductsStore,
        { provide: AuthService, useValue: authService },
        { provide: GetProductsUseCase, useValue: getProductsUseCase },
        { provide: CreateProductUseCase, useValue: createProductUseCase },
        { provide: UpdateProductUseCase, useValue: updateProductUseCase },
        { provide: ToggleProductStatusUseCase, useValue: toggleProductStatusUseCase },
        { provide: GetProductByIdUseCase, useValue: getProductByIdUseCase },
        { provide: CheckProductCodeUseCase, useValue: checkProductCodeUseCase },
        { provide: GetLowStockProductsUseCase, useValue: getLowStockProductsUseCase },
        { provide: GetProductCategoriesUseCase, useValue: getProductCategoriesUseCase },
      ],
    });

    store = TestBed.inject(ProductsStore);
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      expect(store.products()).toEqual([]);
      expect(store.total()).toBe(0);
      expect(store.page()).toBe(1);
      expect(store.pageSize()).toBe(20);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.searchQuery()).toBe('');
      expect(store.categoryFilter()).toBeNull();
      expect(store.statusFilter()).toBeNull();
      expect(store.dialogVisible()).toBe(false);
      expect(store.dialogMode()).toBe('create');
    });
  });

  describe('Computed Properties', () => {
    it('should allow edit for Administrator', () => {
      authService.user.mockReturnValue({ role: 'Administrator' });
      expect(store.canEdit()).toBe(true);
    });

    it('should allow edit for Manager', () => {
      authService.user.mockReturnValue({ role: 'Manager' });
      expect(store.canEdit()).toBe(true);
    });

    it('should not allow edit for Employee', () => {
      authService.user.mockReturnValue({ role: 'Employee' });
      expect(store.canEdit()).toBe(false);
    });

    it('should calculate total pages correctly', () => {
      store.total.set(50);
      store.pageSize.set(20);
      expect(store.totalPages()).toBe(3);
    });

    it('should enrich products with computed properties', () => {
      store.products.set([mockProduct]);
      const enriched = store.productsView();
      
      expect(enriched[0]).toEqual({
        ...mockProduct,
        isLowStock: false,
        statusClass: 'active',
      });
    });

    it('should identify low stock products', () => {
      const lowStockProduct = { ...mockProduct, stock: 3, minStock: 5 };
      store.products.set([mockProduct, lowStockProduct]);
      
      const enriched = store.productsView();
      expect(enriched[0].isLowStock).toBe(false);
      expect(enriched[1].isLowStock).toBe(true);
    });
  });

  describe('Data Loading', () => {
    it('should load products successfully', async () => {
      const mockResult = {
        data: [mockProduct],
        total: 1,
        page: 1,
        pageSize: 20,
      };
      getProductsUseCase.execute.mockReturnValue(of(mockResult));

      await store.loadProducts();

      expect(store.products()).toEqual([mockProduct]);
      expect(store.total()).toBe(1);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('should handle loading errors', async () => {
      const error = new ProductValidationError('Test error');
      getProductsUseCase.execute.mockReturnValue(throwError(() => error));

      await store.loadProducts();

      expect(store.error()).toBe('Product validation failed.');
      expect(store.loading()).toBe(false);
    });

    it('should load categories successfully', async () => {
      getProductCategoriesUseCase.execute.mockReturnValue(of([mockCategory]));

      await store.loadCategories();

      expect(store.categories()).toEqual([mockCategory]);
    });

    it('should load low stock products', async () => {
      getLowStockProductsUseCase.execute.mockReturnValue(of([mockProduct]));

      await store.loadLowStockProducts();

      expect(store.lowStockProducts()).toEqual([mockProduct]);
    });
  });

  describe('CRUD Operations', () => {
    it('should create product successfully', async () => {
      const payload: CreateProductPayload = {
        code: 'NEW001',
        name: 'New Product',
        description: 'New Description',
        categoryId: 1,
        price: 50,
        stock: 20,
        minStock: 10,
      };
      
      createProductUseCase.execute.mockReturnValue(of(mockProduct));
      getProductsUseCase.execute.mockReturnValue(of({
        data: [mockProduct],
        total: 1,
        page: 1,
        pageSize: 20,
      }));

      await store.createProduct(payload);

      expect(createProductUseCase.execute).toHaveBeenCalledWith(payload);
      expect(store.dialogVisible()).toBe(false);
    });

    it('should update product successfully', async () => {
      const payload: UpdateProductPayload = {
        name: 'Updated Product',
      };
      
      updateProductUseCase.execute.mockReturnValue(of(mockProduct));
      getProductsUseCase.execute.mockReturnValue(of({
        data: [mockProduct],
        total: 1,
        page: 1,
        pageSize: 20,
      }));

      await store.updateProduct(1, payload);

      expect(updateProductUseCase.execute).toHaveBeenCalledWith(1, payload);
      expect(store.dialogVisible()).toBe(false);
    });

    it('should toggle product status successfully', async () => {
      const inactiveProduct = { ...mockProduct, isActive: false };
      
      toggleProductStatusUseCase.execute.mockReturnValue(of(undefined));
      getProductsUseCase.execute.mockReturnValue(of({
        data: [inactiveProduct],
        total: 1,
        page: 1,
        pageSize: 20,
      }));

      await store.toggleProductStatus(mockProduct);

      expect(toggleProductStatusUseCase.execute).toHaveBeenCalledWith(1, false);
      expect(store.confirmDialogVisible()).toBe(false);
    });

    it('should load product by id successfully', async () => {
      getProductByIdUseCase.execute.mockReturnValue(of(mockProduct));

      await store.loadProductById(1);

      expect(getProductByIdUseCase.execute).toHaveBeenCalledWith(1);
      expect(store.selectedProduct()).toEqual(mockProduct);
    });
  });

  describe('Validation', () => {
    it('should validate product code successfully', async () => {
      checkProductCodeUseCase.execute.mockReturnValue(of(false));

      await store.validateProductCode('NEW001');

      expect(checkProductCodeUseCase.execute).toHaveBeenCalledWith('NEW001');
      expect(store.codeValidationError()).toBeNull();
      expect(store.codeValidationLoading()).toBe(false);
    });

    it('should show error for duplicate code', async () => {
      checkProductCodeUseCase.execute.mockReturnValue(of(true));

      await store.validateProductCode('DUPLICATE001');

      expect(store.codeValidationError()).toBe('Product code already exists');
    });

    it('should clear validation error for empty code', async () => {
      await store.validateProductCode('');

      expect(store.codeValidationError()).toBeNull();
    });
  });

  describe('Dialog Actions', () => {
    it('should open create dialog', () => {
      store.openCreateDialog();

      expect(store.dialogMode()).toBe('create');
      expect(store.dialogVisible()).toBe(true);
      expect(store.selectedProduct()).toBeNull();
    });

    it('should open edit dialog and load product', async () => {
      getProductByIdUseCase.execute.mockReturnValue(of(mockProduct));

      await store.openEditDialog(1);

      expect(getProductByIdUseCase.execute).toHaveBeenCalledWith(1);
      expect(store.dialogMode()).toBe('edit');
      expect(store.dialogVisible()).toBe(true);
      expect(store.selectedProduct()).toEqual(mockProduct);
    });

    it('should open view dialog', async () => {
      getProductByIdUseCase.execute.mockReturnValue(of(mockProduct));

      store.openViewDialog(1);

      expect(getProductByIdUseCase.execute).toHaveBeenCalledWith(1);
      expect(store.dialogMode()).toBe('view');
      expect(store.dialogVisible()).toBe(true);
    });

    it('should close dialog', () => {
      store.dialogVisible.set(true);
      store.selectedProduct.set(mockProduct);
      store.codeValidationError.set('Error');

      store.closeDialog();

      expect(store.dialogVisible()).toBe(false);
      expect(store.selectedProduct()).toBeNull();
      expect(store.codeValidationError()).toBeNull();
    });

    it('should open confirm dialog', () => {
      store.openConfirmDialog(mockProduct);

      expect(store.confirmDialogVisible()).toBe(true);
      expect(store.productToToggle()).toEqual(mockProduct);
    });

    it('should close confirm dialog', () => {
      store.confirmDialogVisible.set(true);
      store.productToToggle.set(mockProduct);

      store.closeConfirmDialog();

      expect(store.confirmDialogVisible()).toBe(false);
      expect(store.productToToggle()).toBeNull();
    });
  });

  describe('Filters and Pagination', () => {
    it('should set search query and reset page', () => {
      store.page.set(5);
      store.setSearchQuery('test');

      expect(store.searchQuery()).toBe('test');
      expect(store.page()).toBe(1);
    });

    it('should set category filter and reset page', () => {
      store.page.set(5);
      store.setCategoryFilter(1);

      expect(store.categoryFilter()).toBe(1);
      expect(store.page()).toBe(1);
    });

    it('should set status filter and reset page', () => {
      store.page.set(5);
      store.setStatusFilter(false);

      expect(store.statusFilter()).toBe(false);
      expect(store.page()).toBe(1);
    });

    it('should handle page change', async () => {
      getProductsUseCase.execute.mockReturnValue(of({
        data: [],
        total: 0,
        page: 2,
        pageSize: 20,
      }));

      await store.onPageChange(2);

      expect(store.page()).toBe(2);
      expect(getProductsUseCase.execute).toHaveBeenCalled();
    });

    it('should handle page size change', async () => {
      getProductsUseCase.execute.mockReturnValue(of({
        data: [],
        total: 0,
        page: 1,
        pageSize: 50,
      }));

      await store.onPageSizeChange(50);

      expect(store.pageSize()).toBe(50);
      expect(store.page()).toBe(1);
      expect(getProductsUseCase.execute).toHaveBeenCalled();
    });
  });

  describe('Utilities', () => {
    it('should refresh products and low stock', async () => {
      getProductsUseCase.execute.mockReturnValue(of({
        data: [],
        total: 0,
        page: 1,
        pageSize: 20,
      }));
      getLowStockProductsUseCase.execute.mockReturnValue(of([]));

      await store.refresh();

      expect(getProductsUseCase.execute).toHaveBeenCalled();
      expect(getLowStockProductsUseCase.execute).toHaveBeenCalled();
    });

    it('should clear error', () => {
      store.error.set('Test error');
      store.clearError();

      expect(store.error()).toBeNull();
    });
  });
});

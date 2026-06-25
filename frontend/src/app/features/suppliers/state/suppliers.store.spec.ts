import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SuppliersStore } from './suppliers.store';
import { Supplier, CreateSupplierRequest, UpdateSupplierRequest } from '@domain/models/supplier.model';
import { SupplierProduct } from '@domain/models/supplier-product.model';
import { PageEvent } from '@domain/models/page-event.model';
import { SupplierStatus } from '@domain/enums/supplier-status.enum';
import { UserRole } from '@domain/enums/user-role.enum';
import { AuthService } from '@core/services/auth.service';
import { GetSuppliersUseCase } from '@domain/usecases/supplier/get-suppliers.usecase';
import { GetSupplierByIdUseCase } from '@domain/usecases/supplier/get-supplier-by-id.usecase';
import { CreateSupplierUseCase } from '@domain/usecases/supplier/create-supplier.usecase';
import { UpdateSupplierUseCase } from '@domain/usecases/supplier/update-supplier.usecase';
import { ActivateSupplierUseCase } from '@domain/usecases/supplier/activate-supplier.usecase';
import { DeactivateSupplierUseCase } from '@domain/usecases/supplier/deactivate-supplier.usecase';
import { GetSupplierProductsUseCase } from '@domain/usecases/supplier/get-supplier-products.usecase';

const MOCK_PROVIDER: Supplier = {
  id: '1',
  name: 'Test Supplier',
  taxId: '123456789',
  email: 'supplier@test.com',
  phone: '+1234567890',
  address: 'Test Address',
  isActive: true,
  status: SupplierStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_PROVIDER_PRODUCT: SupplierProduct = {
  id: '1',
  productId: '1',
  productName: 'Test Product',
  supplierId: '1',
  specificPrice: 99.99,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_AUTH_USER = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  role: UserRole.Administrator,
};

describe('SuppliersStore', () => {
  let store: SuppliersStore;
  let mockAuthService: { user: ReturnType<typeof vi.fn> };
  let mockGetProvidersUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockGetProviderByIdUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockCreateProviderUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockUpdateProviderUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockActivateProviderUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockDeactivateProviderUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockGetProviderProductsUseCase: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAuthService = {
      user: vi.fn().mockReturnValue(MOCK_AUTH_USER),
    };

    mockGetProvidersUseCase = {
      execute: vi.fn(),
    };

    mockGetProviderByIdUseCase = {
      execute: vi.fn(),
    };

    mockCreateProviderUseCase = {
      execute: vi.fn(),
    };

    mockUpdateProviderUseCase = {
      execute: vi.fn(),
    };

    mockActivateProviderUseCase = {
      execute: vi.fn(),
    };

    mockDeactivateProviderUseCase = {
      execute: vi.fn(),
    };

    mockGetProviderProductsUseCase = {
      execute: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        SuppliersStore,
        { provide: AuthService, useValue: mockAuthService },
        { provide: GetSuppliersUseCase, useValue: mockGetProvidersUseCase },
        { provide: GetSupplierByIdUseCase, useValue: mockGetProviderByIdUseCase },
        { provide: CreateSupplierUseCase, useValue: mockCreateProviderUseCase },
        { provide: UpdateSupplierUseCase, useValue: mockUpdateProviderUseCase },
        { provide: ActivateSupplierUseCase, useValue: mockActivateProviderUseCase },
        { provide: DeactivateSupplierUseCase, useValue: mockDeactivateProviderUseCase },
        { provide: GetSupplierProductsUseCase, useValue: mockGetProviderProductsUseCase },
      ],
    });

    store = TestBed.inject(SuppliersStore);
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(store.suppliers()).toEqual([]);
      expect(store.total()).toBe(0);
      expect(store.page()).toBe(1);
      expect(store.pageSize()).toBe(20);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBe(null);
      expect(store.formError()).toBe(null);
      expect(store.searchQuery()).toBe('');
      expect(store.statusFilter()).toBe(null);
      expect(store.selectedSupplier()).toBe(null);
      expect(store.dialogVisible()).toBe(false);
      expect(store.dialogMode()).toBe('create');
      expect(store.confirmDialogVisible()).toBe(false);
      expect(store.supplierToToggle()).toBe(null);
      expect(store.productsDialogVisible()).toBe(false);
      expect(store.selectedSupplierForProducts()).toBe(null);
    });

    it('should compute canEdit correctly for admin', () => {
      expect(store.canEdit()).toBe(true);
    });

    it('should compute canEdit correctly for purchases manager', () => {
      mockAuthService.user.mockReturnValue({ ...MOCK_AUTH_USER, role: UserRole.Manager });
      expect(store.canEdit()).toBe(true);
    });

    it('should compute canEdit correctly for regular user', () => {
      mockAuthService.user.mockReturnValue({ ...MOCK_AUTH_USER, role: UserRole.Employee });
      expect(store.canEdit()).toBe(false);
    });

    it('should compute totalPages correctly', () => {
      store.total.set(100);
      store.pageSize.set(20);
      expect(store.totalPages()).toBe(5);
    });

    it('should compute suppliersView with product count', () => {
      store.suppliers.set([MOCK_PROVIDER]);
      store.supplierProducts.set([MOCK_PROVIDER_PRODUCT]);
      const view = store.suppliersView();
      expect(view[0].productCount).toBe(1);
    });

    it('should expose supplier list for table rendering', () => {
      store.suppliers.set([MOCK_PROVIDER]);

      expect(store.filteredSuppliers()).toEqual([MOCK_PROVIDER]);

      // In lazy mode, filters are applied by backend and table receives supplier list as-is.
      store.searchQuery.set('test');
      store.statusFilter.set(SupplierStatus.INACTIVE);
      expect(store.filteredSuppliers()).toEqual([MOCK_PROVIDER]);
    });
  });

  describe('Load Suppliers', () => {
    it('should load suppliers successfully', async () => {
      const mockResult = { data: [MOCK_PROVIDER], total: 1 };
      mockGetProvidersUseCase.execute.mockResolvedValue(mockResult);

      await store.loadSuppliers();

      expect(mockGetProvidersUseCase.execute).toHaveBeenCalledWith({
        page: 1,
        rows: 20,
        first: 0,
      });
      expect(store.suppliers()).toEqual([MOCK_PROVIDER]);
      expect(store.total()).toBe(1);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBe(null);
    });

    it('should load suppliers with pagination', async () => {
      const mockResult = { data: [MOCK_PROVIDER], total: 1 };
      const pageEvent: PageEvent = { page: 1, rows: 10 };
      mockGetProvidersUseCase.execute.mockResolvedValue(mockResult);

      await store.loadSuppliers(pageEvent);

      expect(mockGetProvidersUseCase.execute).toHaveBeenCalledWith({
        page: 1,
        rows: 10,
        first: 0,
      });
      expect(store.page()).toBe(1); // page se establece desde el evento
      expect(store.pageSize()).toBe(10);
    });

    it('should handle load suppliers error', async () => {
      const error = new Error('Failed to load');
      mockGetProvidersUseCase.execute.mockRejectedValue(error);

      await store.loadSuppliers();

      expect(store.loading()).toBe(false);
      expect(store.error()).toBe('Failed to load');
    });
  });

  describe('Load Supplier By ID', () => {
    it('should load supplier by id successfully', async () => {
      mockGetProviderByIdUseCase.execute.mockResolvedValue(MOCK_PROVIDER);

      const result = await store.loadSupplierById('1');

      expect(mockGetProviderByIdUseCase.execute).toHaveBeenCalledWith('1');
      expect(result).toEqual(MOCK_PROVIDER);
    });

    it('should handle load supplier by id error', async () => {
      const error = new Error('Not found');
      mockGetProviderByIdUseCase.execute.mockRejectedValue(error);

      const result = await store.loadSupplierById('1');

      expect(result).toBe(null);
      expect(store.error()).toBe('Not found');
    });
  });

  describe('Load Supplier Products', () => {
    it('should load supplier products successfully', async () => {
      const mockResult = [MOCK_PROVIDER_PRODUCT];
      mockGetProviderProductsUseCase.execute.mockResolvedValue(mockResult);

      await store.loadSupplierProducts('1');

      expect(mockGetProviderProductsUseCase.execute).toHaveBeenCalledWith('1');
      expect(store.supplierProducts()).toEqual([MOCK_PROVIDER_PRODUCT]);
    });

    it('should handle load supplier products error', async () => {
      const error = new Error('Failed to load products');
      mockGetProviderProductsUseCase.execute.mockRejectedValue(error);

      await store.loadSupplierProducts('1');

      expect(store.error()).toBe('Failed to load products');
    });
  });

  describe('Dialog Management', () => {
    it('should open create dialog', () => {
      store.openCreateDialog();

      expect(store.selectedSupplier()).toBe(null);
      expect(store.dialogMode()).toBe('create');
      expect(store.dialogVisible()).toBe(true);
    });

    it('should open edit dialog', async () => {
      mockGetProviderByIdUseCase.execute.mockResolvedValue(MOCK_PROVIDER);

      await store.openEditDialog(MOCK_PROVIDER);

      expect(mockGetProviderByIdUseCase.execute).toHaveBeenCalledWith('1');
      expect(store.selectedSupplier()).toEqual(MOCK_PROVIDER);
      expect(store.dialogMode()).toBe('edit');
      expect(store.dialogVisible()).toBe(true);
    });


    it('should close dialog', () => {
      store.dialogVisible.set(true);
      store.selectedSupplier.set(MOCK_PROVIDER);

      store.closeDialog();

      expect(store.dialogVisible()).toBe(false);
      expect(store.selectedSupplier()).toBe(null);
    });

    it('should open products dialog', () => {
      mockGetProviderProductsUseCase.execute.mockResolvedValue([MOCK_PROVIDER_PRODUCT]);

      store.openProductsDialog(MOCK_PROVIDER);

      expect(store.selectedSupplierForProducts()).toEqual(MOCK_PROVIDER);
      expect(store.productsDialogVisible()).toBe(true);
      expect(mockGetProviderProductsUseCase.execute).toHaveBeenCalledWith('1');
    });

    it('should close products dialog', () => {
      store.productsDialogVisible.set(true);
      store.selectedSupplierForProducts.set(MOCK_PROVIDER);
      store.supplierProducts.set([MOCK_PROVIDER_PRODUCT]);

      store.closeProductsDialog();

      expect(store.productsDialogVisible()).toBe(false);
      expect(store.selectedSupplierForProducts()).toBe(null);
      expect(store.supplierProducts()).toEqual([]);
    });

    it('should request toggle status', () => {
      store.requestToggleStatus(MOCK_PROVIDER);

      expect(store.supplierToToggle()).toEqual(MOCK_PROVIDER);
      expect(store.confirmDialogVisible()).toBe(true);
    });

    it('should cancel toggle status', () => {
      store.supplierToToggle.set(MOCK_PROVIDER);
      store.confirmDialogVisible.set(true);

      store.cancelToggleStatus();

      expect(store.supplierToToggle()).toBe(null);
      expect(store.confirmDialogVisible()).toBe(false);
    });
  });

  describe('CRUD Operations', () => {
    it('should save new supplier successfully', async () => {
      const createPayload: CreateSupplierRequest = {
        name: 'New Supplier',
        taxId: '123456789',
        email: 'new@test.com',
      };
      mockCreateProviderUseCase.execute.mockResolvedValue(MOCK_PROVIDER);

      store.dialogMode.set('create');
      await store.saveSupplier(createPayload);

      expect(mockCreateProviderUseCase.execute).toHaveBeenCalledWith(createPayload);
      expect(store.suppliers()).toContain(MOCK_PROVIDER);
      expect(store.total()).toBe(1);
      expect(store.dialogVisible()).toBe(false);
    });

    it('should save updated supplier successfully', async () => {
      const updatePayload: UpdateSupplierRequest = { name: 'Updated Supplier' };
      const updatedProvider = { ...MOCK_PROVIDER, name: 'Updated Supplier' };
      mockUpdateProviderUseCase.execute.mockResolvedValue(updatedProvider);
      store.suppliers.set([MOCK_PROVIDER]);

      store.dialogMode.set('edit');
      store.selectedSupplier.set(MOCK_PROVIDER);
      await store.saveSupplier(updatePayload);

      expect(mockUpdateProviderUseCase.execute).toHaveBeenCalledWith('1', updatePayload);
      expect(store.suppliers()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: updatedProvider.id,
            name: updatedProvider.name,
          }),
        ]),
      );
      expect(store.dialogVisible()).toBe(false);
    });

    it('should handle save supplier error', async () => {
      const error = new Error('Validation failed');
      mockCreateProviderUseCase.execute.mockRejectedValue(error);
      store.dialogVisible.set(true);

      await store.saveSupplier({ name: 'Test', taxId: '123', email: 'test@test.com' });

      expect(store.loading()).toBe(false);
      expect(store.formError()).toBe('Validation failed');
      expect(store.error()).toBe(null);
      expect(store.dialogVisible()).toBe(true);
    });

    it('should confirm toggle status to inactive', async () => {
      const activeProvider = { ...MOCK_PROVIDER, isActive: true, status: SupplierStatus.ACTIVE };
      const inactiveProvider = { ...MOCK_PROVIDER, isActive: false, status: SupplierStatus.INACTIVE };
      mockDeactivateProviderUseCase.execute.mockResolvedValue(inactiveProvider);
      store.suppliers.set([activeProvider]);
      store.supplierToToggle.set(activeProvider);

      await store.confirmToggleStatus();

      expect(mockDeactivateProviderUseCase.execute).toHaveBeenCalledWith('1');
      expect(store.suppliers()[0].isActive).toBe(false);
      expect(store.confirmDialogVisible()).toBe(false);
      expect(store.supplierToToggle()).toBe(null);
    });

    it('should confirm toggle status to active', async () => {
      const inactiveProvider = { ...MOCK_PROVIDER, isActive: false, status: SupplierStatus.INACTIVE };
      const activeProvider = { ...MOCK_PROVIDER, isActive: true, status: SupplierStatus.ACTIVE };
      mockActivateProviderUseCase.execute.mockResolvedValue(activeProvider);
      store.suppliers.set([inactiveProvider]);
      store.supplierToToggle.set(inactiveProvider);

      await store.confirmToggleStatus();

      expect(mockActivateProviderUseCase.execute).toHaveBeenCalledWith('1');
      expect(store.suppliers()[0].isActive).toBe(true);
      expect(store.confirmDialogVisible()).toBe(false);
      expect(store.supplierToToggle()).toBe(null);
    });

    it('should handle toggle status error', async () => {
      const error = new Error('Failed to update');
      mockDeactivateProviderUseCase.execute.mockRejectedValue(error);
      store.supplierToToggle.set(MOCK_PROVIDER);

      await store.confirmToggleStatus();

      expect(store.loading()).toBe(false);
      expect(store.error()).toBe('Failed to update');
      expect(store.confirmDialogVisible()).toBe(false);
    });
  });

  describe('Filters and Pagination', () => {
    it('should handle search', async () => {
      mockGetProvidersUseCase.execute.mockResolvedValue({ data: [], total: 0 });

      store.onSearch('test');

      expect(store.searchQuery()).toBe('test');
      expect(store.page()).toBe(1);
      expect(mockGetProvidersUseCase.execute).toHaveBeenCalledWith({
        page: 1,
        rows: 20,
        first: 0,
        query: 'test',
      });
    });

    it('should handle status filter change', async () => {
      mockGetProvidersUseCase.execute.mockResolvedValue({ data: [], total: 0 });

      store.onStatusFilterChange(SupplierStatus.ACTIVE);

      expect(store.statusFilter()).toBe(SupplierStatus.ACTIVE);
      expect(store.page()).toBe(1);
      expect(mockGetProvidersUseCase.execute).toHaveBeenCalledWith({
        page: 1,
        rows: 20,
        first: 0,
        status: SupplierStatus.ACTIVE,
        isActive: true,
      });
    });

    it('should handle page change', () => {
      const pageEvent: PageEvent = { first: 10, rows: 10, page: 1 };
      mockGetProvidersUseCase.execute.mockResolvedValue({
        data: [],
        total: 0,
      });

      store.onPageChange(pageEvent);

      expect(store.page()).toBe(2); // PrimeNG base 0 + 1 = store base 1
      expect(store.pageSize()).toBe(10);
      expect(mockGetProvidersUseCase.execute).toHaveBeenCalledWith({ ...pageEvent, page: 2, first: 10, rows: 10 });
    });
  });

  describe('Utilities', () => {
    it('should clear error', () => {
      store.error.set('Test error');

      store.clearError();

      expect(store.error()).toBe(null);
    });

    it('should reset filters', async () => {
      store.searchQuery.set('test');
      store.statusFilter.set(SupplierStatus.ACTIVE);
      store.page.set(2);
      mockGetProvidersUseCase.execute.mockResolvedValue({ data: [], total: 0 });

      store.resetFilters();

      expect(store.searchQuery()).toBe('');
      expect(store.statusFilter()).toBe(null);
      expect(store.page()).toBe(1);
      expect(mockGetProvidersUseCase.execute).toHaveBeenCalledWith({
        page: 1,
        rows: 20,
        first: 0,
      });
    });
  });

  describe('Error Mapping', () => {
    it('should map validation error', () => {
      const error = new Error('Validation failed: Name is required');
      const result = store['resolveErrorMessage'](error, 'Fallback');
      expect(result).toBe('Validation failed: Name is required');
    });

    it('should map authentication error', () => {
      const error = new Error('Authentication required');
      const result = store['resolveErrorMessage'](error, 'Fallback');
      expect(result).toBe('Your session has expired. Please sign in again.');
    });

    it('should map permissions error', () => {
      const error = new Error('Insufficient permissions');
      const result = store['resolveErrorMessage'](error, 'Fallback');
      expect(result).toBe('You do not have permissions to perform this action.');
    });

    it('should map not found error', () => {
      const error = new Error('Supplier not found');
      const result = store['resolveErrorMessage'](error, 'Fallback');
      expect(result).toBe('The selected supplier no longer exists.');
    });

    it('should return fallback for unknown error', () => {
      const error = new Error('Unknown error');
      const result = store['resolveErrorMessage'](error, 'Fallback message');
      expect(result).toBe('Unknown error');
    });

    it('should return fallback for non-error objects', () => {
      const result = store['resolveErrorMessage']('string error', 'Fallback message');
      expect(result).toBe('Fallback message');
    });
  });
});


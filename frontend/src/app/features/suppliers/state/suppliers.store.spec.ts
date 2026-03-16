import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SuppliersStore } from './suppliers.store';
import { Provider, CreateProviderRequest, UpdateProviderRequest } from '@domain/models/provider.model';
import { ProviderProduct } from '@domain/models/provider-product.model';
import { PageEvent } from '@domain/models/page-event.model';
import { ProviderStatus } from '@domain/enums/provider-status.enum';
import { UserRole } from '@domain/enums/user-role.enum';
import { AuthService } from '@core/services/auth.service';
import { GetProvidersUseCase } from '@domain/usecases/supplier/get-providers.usecase';
import { GetProviderByIdUseCase } from '@domain/usecases/supplier/get-provider-by-id.usecase';
import { CreateProviderUseCase } from '@domain/usecases/supplier/create-provider.usecase';
import { UpdateProviderUseCase } from '@domain/usecases/supplier/update-provider.usecase';
import { ActivateProviderUseCase } from '@domain/usecases/supplier/activate-provider.usecase';
import { DeactivateProviderUseCase } from '@domain/usecases/supplier/deactivate-provider.usecase';
import { GetProviderProductsUseCase } from '@domain/usecases/supplier/get-provider-products.usecase';

const MOCK_PROVIDER: Provider = {
  id: '1',
  name: 'Test Provider',
  taxId: '123456789',
  email: 'provider@test.com',
  phone: '+1234567890',
  address: 'Test Address',
  contactPerson: 'Contact Person',
  isActive: true,
  status: ProviderStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_PROVIDER_PRODUCT: ProviderProduct = {
  id: '1',
  productId: '1',
  productName: 'Test Product',
  providerId: '1',
  specificPrice: 99.99,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_AUTH_USER = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  role: UserRole.ADMIN,
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
        { provide: GetProvidersUseCase, useValue: mockGetProvidersUseCase },
        { provide: GetProviderByIdUseCase, useValue: mockGetProviderByIdUseCase },
        { provide: CreateProviderUseCase, useValue: mockCreateProviderUseCase },
        { provide: UpdateProviderUseCase, useValue: mockUpdateProviderUseCase },
        { provide: ActivateProviderUseCase, useValue: mockActivateProviderUseCase },
        { provide: DeactivateProviderUseCase, useValue: mockDeactivateProviderUseCase },
        { provide: GetProviderProductsUseCase, useValue: mockGetProviderProductsUseCase },
      ],
    });

    store = TestBed.inject(SuppliersStore);
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(store.providers()).toEqual([]);
      expect(store.total()).toBe(0);
      expect(store.page()).toBe(1);
      expect(store.pageSize()).toBe(20);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBe(null);
      expect(store.searchQuery()).toBe('');
      expect(store.statusFilter()).toBe(null);
      expect(store.selectedProvider()).toBe(null);
      expect(store.dialogVisible()).toBe(false);
      expect(store.dialogMode()).toBe('create');
      expect(store.confirmDialogVisible()).toBe(false);
      expect(store.providerToToggle()).toBe(null);
      expect(store.productsDialogVisible()).toBe(false);
      expect(store.selectedProviderForProducts()).toBe(null);
    });

    it('should compute canEdit correctly for admin', () => {
      expect(store.canEdit()).toBe(true);
    });

    it('should compute canEdit correctly for purchases manager', () => {
      mockAuthService.user.mockReturnValue({ ...MOCK_AUTH_USER, role: UserRole.PURCHASES_MANAGER });
      expect(store.canEdit()).toBe(true);
    });

    it('should compute canEdit correctly for regular user', () => {
      mockAuthService.user.mockReturnValue({ ...MOCK_AUTH_USER, role: UserRole.USER });
      expect(store.canEdit()).toBe(false);
    });

    it('should compute totalPages correctly', () => {
      store.total.set(100);
      store.pageSize.set(20);
      expect(store.totalPages()).toBe(5);
    });

    it('should compute providersView with product count', () => {
      store.providers.set([MOCK_PROVIDER]);
      store.providerProducts.set([MOCK_PROVIDER_PRODUCT]);
      const view = store.providersView();
      expect(view[0].productCount).toBe(1);
    });

    it('should compute filteredProviders correctly', () => {
      store.providers.set([MOCK_PROVIDER]);
      
      // Test search filter
      store.searchQuery.set('test');
      let filtered = store.filteredProviders();
      expect(filtered).toHaveLength(1);
      
      // Test status filter
      store.searchQuery.set('');
      store.statusFilter.set(ProviderStatus.ACTIVE);
      filtered = store.filteredProviders();
      expect(filtered).toHaveLength(1);
      
      // Test status filter with different status
      store.statusFilter.set(ProviderStatus.INACTIVE);
      filtered = store.filteredProviders();
      expect(filtered).toHaveLength(0);
    });
  });

  describe('Load Providers', () => {
    it('should load providers successfully', async () => {
      const mockResult = { data: [MOCK_PROVIDER], total: 1 };
      mockGetProvidersUseCase.execute.mockResolvedValue(mockResult);

      await store.loadProviders();

      expect(mockGetProvidersUseCase.execute).toHaveBeenCalledWith(undefined);
      expect(store.providers()).toEqual([MOCK_PROVIDER]);
      expect(store.total()).toBe(1);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBe(null);
    });

    it('should load providers with pagination', async () => {
      const mockResult = { data: [MOCK_PROVIDER], total: 1 };
      const pageEvent: PageEvent = { page: 1, rows: 10 };
      mockGetProvidersUseCase.execute.mockResolvedValue(mockResult);

      await store.loadProviders(pageEvent);

      expect(mockGetProvidersUseCase.execute).toHaveBeenCalledWith(pageEvent);
      expect(store.page()).toBe(1); // page se establece desde el evento
      expect(store.pageSize()).toBe(10);
    });

    it('should handle load providers error', async () => {
      const error = new Error('Failed to load');
      mockGetProvidersUseCase.execute.mockRejectedValue(error);

      await store.loadProviders();

      expect(store.loading()).toBe(false);
      expect(store.error()).toBe('Failed to load');
    });
  });

  describe('Load Provider By ID', () => {
    it('should load provider by id successfully', async () => {
      mockGetProviderByIdUseCase.execute.mockResolvedValue(MOCK_PROVIDER);

      const result = await store.loadProviderById('1');

      expect(mockGetProviderByIdUseCase.execute).toHaveBeenCalledWith('1');
      expect(result).toEqual(MOCK_PROVIDER);
    });

    it('should handle load provider by id error', async () => {
      const error = new Error('Not found');
      mockGetProviderByIdUseCase.execute.mockRejectedValue(error);

      const result = await store.loadProviderById('1');

      expect(result).toBe(null);
      expect(store.error()).toBe('Not found');
    });
  });

  describe('Load Provider Products', () => {
    it('should load provider products successfully', async () => {
      const mockResult = [{ ...MOCK_PROVIDER, products: [MOCK_PROVIDER_PRODUCT] }];
      mockGetProviderProductsUseCase.execute.mockResolvedValue(mockResult);

      await store.loadProviderProducts('1');

      expect(mockGetProviderProductsUseCase.execute).toHaveBeenCalledWith('1');
      expect(store.providerProducts()).toEqual([MOCK_PROVIDER_PRODUCT]);
    });

    it('should handle load provider products error', async () => {
      const error = new Error('Failed to load products');
      mockGetProviderProductsUseCase.execute.mockRejectedValue(error);

      await store.loadProviderProducts('1');

      expect(store.error()).toBe('Failed to load products');
    });
  });

  describe('Dialog Management', () => {
    it('should open create dialog', () => {
      store.openCreateDialog();

      expect(store.selectedProvider()).toBe(null);
      expect(store.dialogMode()).toBe('create');
      expect(store.dialogVisible()).toBe(true);
    });

    it('should open edit dialog', async () => {
      mockGetProviderByIdUseCase.execute.mockResolvedValue(MOCK_PROVIDER);

      await store.openEditDialog(MOCK_PROVIDER);

      expect(mockGetProviderByIdUseCase.execute).toHaveBeenCalledWith('1');
      expect(store.selectedProvider()).toEqual(MOCK_PROVIDER);
      expect(store.dialogMode()).toBe('edit');
      expect(store.dialogVisible()).toBe(true);
    });

    it('should close dialog', () => {
      store.dialogVisible.set(true);
      store.selectedProvider.set(MOCK_PROVIDER);

      store.closeDialog();

      expect(store.dialogVisible()).toBe(false);
      expect(store.selectedProvider()).toBe(null);
    });

    it('should open products dialog', () => {
      mockGetProviderProductsUseCase.execute.mockResolvedValue([{ products: [MOCK_PROVIDER_PRODUCT] }]);

      store.openProductsDialog(MOCK_PROVIDER);

      expect(store.selectedProviderForProducts()).toEqual(MOCK_PROVIDER);
      expect(store.productsDialogVisible()).toBe(true);
      expect(mockGetProviderProductsUseCase.execute).toHaveBeenCalledWith('1');
    });

    it('should close products dialog', () => {
      store.productsDialogVisible.set(true);
      store.selectedProviderForProducts.set(MOCK_PROVIDER);
      store.providerProducts.set([MOCK_PROVIDER_PRODUCT]);

      store.closeProductsDialog();

      expect(store.productsDialogVisible()).toBe(false);
      expect(store.selectedProviderForProducts()).toBe(null);
      expect(store.providerProducts()).toEqual([]);
    });

    it('should request toggle status', () => {
      store.requestToggleStatus(MOCK_PROVIDER);

      expect(store.providerToToggle()).toEqual(MOCK_PROVIDER);
      expect(store.confirmDialogVisible()).toBe(true);
    });

    it('should cancel toggle status', () => {
      store.providerToToggle.set(MOCK_PROVIDER);
      store.confirmDialogVisible.set(true);

      store.cancelToggleStatus();

      expect(store.providerToToggle()).toBe(null);
      expect(store.confirmDialogVisible()).toBe(false);
    });
  });

  describe('CRUD Operations', () => {
    it('should save new provider successfully', async () => {
      const createPayload: CreateProviderRequest = {
        name: 'New Provider',
        taxId: '123456789',
        email: 'new@test.com',
      };
      mockCreateProviderUseCase.execute.mockResolvedValue(MOCK_PROVIDER);
      mockGetProvidersUseCase.execute.mockResolvedValue({
        data: [MOCK_PROVIDER],
        total: 1,
      });

      store.dialogMode.set('create');
      await store.saveProvider(createPayload);

      expect(mockCreateProviderUseCase.execute).toHaveBeenCalledWith(createPayload);
      expect(mockGetProvidersUseCase.execute).toHaveBeenCalled();
      expect(store.providers()).toContain(MOCK_PROVIDER);
      expect(store.total()).toBe(1);
      expect(store.dialogVisible()).toBe(false);
    });

    it('should save updated provider successfully', async () => {
      const updatePayload: UpdateProviderRequest = { name: 'Updated Provider' };
      const updatedProvider = { ...MOCK_PROVIDER, name: 'Updated Provider' };
      mockUpdateProviderUseCase.execute.mockResolvedValue(updatedProvider);
      store.providers.set([MOCK_PROVIDER]);

      store.dialogMode.set('edit');
      store.selectedProvider.set(MOCK_PROVIDER);
      await store.saveProvider(updatePayload);

      expect(mockUpdateProviderUseCase.execute).toHaveBeenCalledWith('1', updatePayload);
      expect(store.providers()).toContain(updatedProvider);
      expect(store.dialogVisible()).toBe(false);
    });

    it('should handle save provider error', async () => {
      const error = new Error('Validation failed');
      mockCreateProviderUseCase.execute.mockRejectedValue(error);

      await store.saveProvider({ name: 'Test', taxId: '123', email: 'test@test.com' });

      expect(store.loading()).toBe(false);
      expect(store.error()).toBe('Validation failed');
      expect(store.dialogVisible()).toBe(false);
    });

    it('should confirm toggle status to inactive', async () => {
      const activeProvider = { ...MOCK_PROVIDER, isActive: true, status: ProviderStatus.ACTIVE };
      const inactiveProvider = { ...MOCK_PROVIDER, isActive: false, status: ProviderStatus.INACTIVE };
      mockDeactivateProviderUseCase.execute.mockResolvedValue(inactiveProvider);
      mockGetProvidersUseCase.execute.mockResolvedValue({
        data: [inactiveProvider],
        total: 1,
      });
      store.providers.set([activeProvider]);
      store.providerToToggle.set(activeProvider);

      await store.confirmToggleStatus();

      expect(mockDeactivateProviderUseCase.execute).toHaveBeenCalledWith('1');
      expect(mockGetProvidersUseCase.execute).toHaveBeenCalled();
      expect(store.providers()[0].isActive).toBe(false);
      expect(store.confirmDialogVisible()).toBe(false);
      expect(store.providerToToggle()).toBe(null);
    });

    it('should confirm toggle status to active', async () => {
      const inactiveProvider = { ...MOCK_PROVIDER, isActive: false, status: ProviderStatus.INACTIVE };
      const activeProvider = { ...MOCK_PROVIDER, isActive: true, status: ProviderStatus.ACTIVE };
      mockActivateProviderUseCase.execute.mockResolvedValue(activeProvider);
      mockGetProvidersUseCase.execute.mockResolvedValue({
        data: [activeProvider],
        total: 1,
      });
      store.providers.set([inactiveProvider]);
      store.providerToToggle.set(inactiveProvider);

      await store.confirmToggleStatus();

      expect(mockActivateProviderUseCase.execute).toHaveBeenCalledWith('1');
      expect(mockGetProvidersUseCase.execute).toHaveBeenCalled();
      expect(store.providers()[0].isActive).toBe(true);
      expect(store.confirmDialogVisible()).toBe(false);
      expect(store.providerToToggle()).toBe(null);
    });

    it('should handle toggle status error', async () => {
      const error = new Error('Failed to update');
      mockDeactivateProviderUseCase.execute.mockRejectedValue(error);
      store.providerToToggle.set(MOCK_PROVIDER);

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
      expect(mockGetProvidersUseCase.execute).toHaveBeenCalled();
    });

    it('should handle status filter change', async () => {
      mockGetProvidersUseCase.execute.mockResolvedValue({ data: [], total: 0 });

      store.onStatusFilterChange(ProviderStatus.ACTIVE);

      expect(store.statusFilter()).toBe(ProviderStatus.ACTIVE);
      expect(store.page()).toBe(1);
      expect(mockGetProvidersUseCase.execute).toHaveBeenCalled();
    });

    it('should handle page change', () => {
      const pageEvent: PageEvent = { first: 10, rows: 10, page: 2 };
      mockGetProvidersUseCase.execute.mockResolvedValue({
        data: [],
        total: 0,
      });

      store.onPageChange(pageEvent);

      expect(store.page()).toBe(2); // PrimeNG base 0 + 1 = store base 1
      expect(store.pageSize()).toBe(10);
      expect(mockGetProvidersUseCase.execute).toHaveBeenCalledWith({ page: 2, rows: 10 });
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
      store.statusFilter.set(ProviderStatus.ACTIVE);
      store.page.set(2);
      mockGetProvidersUseCase.execute.mockResolvedValue({ data: [], total: 0 });

      store.resetFilters();

      expect(store.searchQuery()).toBe('');
      expect(store.statusFilter()).toBe(null);
      expect(store.page()).toBe(1);
      expect(mockGetProvidersUseCase.execute).toHaveBeenCalled();
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
      const error = new Error('Provider not found');
      const result = store['resolveErrorMessage'](error, 'Fallback');
      expect(result).toBe('The selected provider no longer exists.');
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

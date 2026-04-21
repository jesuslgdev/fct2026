import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signal } from '@angular/core';
import { SupplierDetailPageComponent } from './supplier-detail.page.component';
import { SuppliersStore } from '@features/suppliers/state/suppliers.store';
import { SupplierProductsStore } from '@features/supplier-product/state/supplier-products.store';
import { ProviderStatus } from '@domain/enums/provider-status.enum';
import { Provider } from '@domain/models/provider.model';

const MOCK_SUPPLIER: Provider = {
  id: '7',
  name: 'Supplier Test',
  taxId: 'B12345678',
  email: 'supplier@test.com',
  phone: '600000000',
  address: 'Test Street',
  city: 'Madrid',
  province: 'Madrid',
  postalCode: '28001',
  isActive: true,
  status: ProviderStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('SupplierDetailPageComponent', () => {
  let fixture: ComponentFixture<SupplierDetailPageComponent>;
  let component: SupplierDetailPageComponent;
  let mockSuppliersStore: {
    canEdit: ReturnType<typeof vi.fn>;
    loadProviderById: ReturnType<typeof vi.fn>;
    openEditDialog: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof signal<string | null>>;
  };
  let mockSupplierProductsStore: {
    supplierPageSize: ReturnType<typeof signal<number>>;
    loadSupplierProducts: ReturnType<typeof vi.fn>;
    onSupplierProductsPageChange: ReturnType<typeof vi.fn>;
    setPriceDraft: ReturnType<typeof vi.fn>;
    setAddProductPriceDraft: ReturnType<typeof vi.fn>;
  };
  let routerNavigate: ReturnType<typeof vi.fn>;
  let routeStub: {
    snapshot: {
      paramMap: ReturnType<typeof convertToParamMap>;
    };
  };

  beforeEach(async () => {
    mockSuppliersStore = {
      canEdit: vi.fn().mockReturnValue(true),
      loadProviderById: vi.fn().mockResolvedValue(MOCK_SUPPLIER),
      openEditDialog: vi.fn().mockResolvedValue(undefined),
      error: signal<string | null>(null),
    };

    mockSupplierProductsStore = {
      supplierPageSize: signal(10),
      loadSupplierProducts: vi.fn().mockResolvedValue(undefined),
      onSupplierProductsPageChange: vi.fn(),
      setPriceDraft: vi.fn(),
      setAddProductPriceDraft: vi.fn(),
    };

    routerNavigate = vi.fn();
    routeStub = {
      snapshot: {
        paramMap: convertToParamMap({ id: '7' }),
      },
    };

    await TestBed.configureTestingModule({
      imports: [SupplierDetailPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: routeStub,
        },
        {
          provide: Router,
          useValue: {
            navigate: routerNavigate,
          },
        },
      ],
    })
      .overrideComponent(SupplierDetailPageComponent, {
        set: {
          template: '',
          imports: [],
          providers: [
            { provide: SuppliersStore, useValue: mockSuppliersStore },
            { provide: SupplierProductsStore, useValue: mockSupplierProductsStore },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SupplierDetailPageComponent);
    component = fixture.componentInstance;
  });

  it('loads supplier detail and supplier products on init with a valid route id', async () => {
    await component.ngOnInit();

    expect(mockSuppliersStore.loadProviderById).toHaveBeenCalledWith('7');
    expect(mockSupplierProductsStore.loadSupplierProducts).toHaveBeenCalledWith(7);
    expect(component.supplier()).toEqual(MOCK_SUPPLIER);
    expect(component.supplierNumericId()).toBe(7);
    expect(component.detailLoading()).toBe(false);
    expect(component.detailError()).toBeNull();
  });

  it('stores an error and skips loading when the route id is invalid', async () => {
    routeStub.snapshot.paramMap = convertToParamMap({ id: 'abc' });

    await component.ngOnInit();

    expect(component.detailError()).toBe('Identificador de proveedor invalido.');
    expect(mockSuppliersStore.loadProviderById).not.toHaveBeenCalled();
    expect(mockSupplierProductsStore.loadSupplierProducts).not.toHaveBeenCalled();
  });

  it('opens the edit dialog when the supplier exists and editing is allowed', async () => {
    component.supplier.set(MOCK_SUPPLIER);

    await component.openEditFromDetail();

    expect(mockSuppliersStore.openEditDialog).toHaveBeenCalledWith(MOCK_SUPPLIER);
  });

  it('does not open the edit dialog when editing is not allowed', async () => {
    component.supplier.set(MOCK_SUPPLIER);
    mockSuppliersStore.canEdit.mockReturnValue(false);

    await component.openEditFromDetail();

    expect(mockSuppliersStore.openEditDialog).not.toHaveBeenCalled();
  });

  it('navigates back to suppliers list', () => {
    component.goBack();

    expect(routerNavigate).toHaveBeenCalledWith(['/suppliers']);
  });

  it('forwards supplier products page changes with fallback rows', () => {
    component.onSupplierProductsPageChange({ first: 20 } as never);

    expect(mockSupplierProductsStore.onSupplierProductsPageChange).toHaveBeenCalledWith({ first: 20, rows: 10 });
  });

  it('updates inline and add price drafts from input events', () => {
    component.onSupplierProductPriceInput({ target: { value: '12.50' } } as never);
    component.onAddProductPriceInput({ target: { value: '18.00' } } as never);

    expect(mockSupplierProductsStore.setPriceDraft).toHaveBeenCalledWith('12.50');
    expect(mockSupplierProductsStore.setAddProductPriceDraft).toHaveBeenCalledWith('18.00');
  });
});

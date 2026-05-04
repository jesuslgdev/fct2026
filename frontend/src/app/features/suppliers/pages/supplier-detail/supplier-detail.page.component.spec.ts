import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProviderStatus } from '@domain/enums/provider-status.enum';
import { Provider } from '@domain/models/provider.model';
import { SuppliersStore } from '@features/suppliers/state/suppliers.store';
import { SupplierDetailPageComponent } from './supplier-detail.page.component';

const PROVIDER: Provider = {
  id: '1',
  name: 'Proveedor Uno',
  taxId: 'B12345678',
  email: 'proveedor@example.com',
  phone: '600000000',
  address: 'Calle Mayor 1',
  city: 'Sevilla',
  province: 'Sevilla',
  postalCode: '41001',
  isActive: true,
  status: ProviderStatus.ACTIVE,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

describe('SupplierDetailPageComponent', () => {
  let fixture: ComponentFixture<SupplierDetailPageComponent>;
  let component: SupplierDetailPageComponent;
  let routeId: string | null;
  let router: { navigate: ReturnType<typeof vi.fn> };
  let store: {
    error: ReturnType<typeof vi.fn>;
    canEdit: ReturnType<typeof vi.fn>;
    loadProviderById: ReturnType<typeof vi.fn>;
    openEditDialog: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    routeId = '1';
    router = { navigate: vi.fn() };
    store = {
      error: vi.fn().mockReturnValue(null),
      canEdit: vi.fn().mockReturnValue(true),
      loadProviderById: vi.fn().mockResolvedValue(PROVIDER),
      openEditDialog: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [SupplierDetailPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => routeId,
              },
            },
          },
        },
        { provide: Router, useValue: router },
      ],
    })
      .overrideComponent(SupplierDetailPageComponent, {
        set: {
          providers: [{ provide: SuppliersStore, useValue: store }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SupplierDetailPageComponent);
    component = fixture.componentInstance;
  });

  it('should load the provider and clear detailLoading with a valid id', async () => {
    await component.ngOnInit();

    expect(store.loadProviderById).toHaveBeenCalledWith('1');
    expect(component.supplierNumericId()).toBe(1);
    expect(component.supplier()).toEqual(PROVIDER);
    expect(component.detailLoading()).toBe(false);
    expect(component.detailError()).toBeNull();
  });

  it.each(['abc', '1.5', '0'])(
    'should set an error and not load the provider when the route id is %s',
    async (invalidId) => {
      routeId = invalidId;

      await component.ngOnInit();

      expect(store.loadProviderById).not.toHaveBeenCalled();
      expect(component.detailError()).toBe('Identificador de proveedor invalido.');
      expect(component.detailLoading()).toBe(false);
    },
  );

  it('should clear detailLoading even if loadProviderById fails', async () => {
    const error = new Error('boom');
    store.loadProviderById.mockRejectedValueOnce(error);

    await expect(component.ngOnInit()).rejects.toThrow('boom');

    expect(component.supplierNumericId()).toBe(1);
    expect(component.detailLoading()).toBe(false);
  });
});
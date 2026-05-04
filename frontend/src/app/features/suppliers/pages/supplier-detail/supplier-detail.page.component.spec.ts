import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SupplierStatus } from '@domain/enums/supplier-status.enum';
import { Supplier } from '@domain/models/supplier.model';
import { SuppliersStore } from '@features/suppliers/state/suppliers.store';
import { SupplierDetailPageComponent } from './supplier-detail.page.component';

const SUPPLIER: Supplier = {
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
  status: SupplierStatus.ACTIVE,
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
    loadSupplierById: ReturnType<typeof vi.fn>;
    openEditDialog: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    routeId = '1';
    router = { navigate: vi.fn() };
    store = {
      error: vi.fn().mockReturnValue(null),
      canEdit: vi.fn().mockReturnValue(true),
      loadSupplierById: vi.fn().mockResolvedValue(SUPPLIER),
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

  it('should load the supplier and clear detailLoading with a valid id', async () => {
    await component.ngOnInit();

    expect(store.loadSupplierById).toHaveBeenCalledWith('1');
    expect(component.supplierNumericId()).toBe(1);
    expect(component.supplier()).toEqual(SUPPLIER);
    expect(component.detailLoading()).toBe(false);
    expect(component.detailError()).toBeNull();
  });

  it.each(['abc', '1.5', '0'])(
    'should set an error and not load the supplier when the route id is %s',
    async (invalidId) => {
      routeId = invalidId;

      await component.ngOnInit();

      expect(store.loadSupplierById).not.toHaveBeenCalled();
      expect(component.detailError()).toBe('Identificador de proveedor invalido.');
      expect(component.detailLoading()).toBe(false);
    },
  );

  it('should clear detailLoading even if loadSupplierById fails', async () => {
    const error = new Error('boom');
    store.loadSupplierById.mockRejectedValueOnce(error);

    await expect(component.ngOnInit()).rejects.toThrow('boom');

    expect(component.supplierNumericId()).toBe(1);
    expect(component.detailLoading()).toBe(false);
  });
});

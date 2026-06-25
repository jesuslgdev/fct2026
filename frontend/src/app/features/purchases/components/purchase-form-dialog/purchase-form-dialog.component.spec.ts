import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  PurchaseDetail,
  PurchaseSupplierOption,
  PurchaseSupplierProductOption,
  PurchaseWarehouseOption,
} from '@domain/models/purchase.model';
import { PurchasesStore } from '@features/purchases/state/purchases.store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PurchaseFormDialogComponent } from './purchase-form-dialog.component';

class MockPurchasesStore {
  readonly dialogVisible = signal(false);
  readonly dialogMode = signal<'create' | 'edit' | 'view'>('create');
  readonly selectedPurchase = signal<PurchaseDetail | null>(null);
  readonly suppliers = signal<PurchaseSupplierOption[]>([]);
  readonly warehouses = signal<PurchaseWarehouseOption[]>([]);
  readonly supplierProducts = signal<PurchaseSupplierProductOption[]>([]);
  readonly supplierProductsBySupplier = signal<Record<number, PurchaseSupplierProductOption[]>>({});
  readonly loadingOptions = signal(false);
  readonly loadingSupplierCatalog = signal(false);
  readonly loadingSupplierProducts = signal(false);
  readonly loadingDetail = signal(false);
  readonly dialogError = signal<string | null>(null);

  readonly closeDialog = vi.fn<() => void>();
  readonly loadSupplierProducts = vi.fn<(supplierId: number) => void>();
  readonly savePurchase = vi.fn<(payload: unknown) => void>();
  readonly setSupplierProducts = vi.fn<(products: PurchaseSupplierProductOption[]) => void>();
  readonly clearSupplierProducts = vi.fn<() => void>();
}

describe('PurchaseFormDialogComponent', () => {
  let component: PurchaseFormDialogComponent;
  let store: MockPurchasesStore;

  beforeEach(() => {
    store = new MockPurchasesStore();

    TestBed.configureTestingModule({
      providers: [{ provide: PurchasesStore, useValue: store }],
    });

    component = TestBed.runInInjectionContext(() => new PurchaseFormDialogComponent());
    component.lines.set([
      {
        productId: 10,
        productName: 'Paper',
        quantity: 1,
        unitPrice: 10,
        vatRate: 21,
      },
    ]);
  });

  it('rejects decimal values with comma separators for quantity', () => {
    component.onLineQuantityChange(0, '10,5');

    expect(component.lines()[0].quantity).toBeNull();
  });

  it('accepts integer quantity values', () => {
    component.onLineQuantityChange(0, '10');

    expect(component.lines()[0].quantity).toBe(10);
  });

  it('parses localized values with thousand separator and decimal comma', () => {
    component.onLineUnitPriceChange(0, '1.234,56');

    expect(component.lines()[0].unitPrice).toBe(1234.56);
  });

  it('sets null when numeric input is invalid', () => {
    component.onLineVatRateChange(0, 'not-a-number');

    expect(component.lines()[0].vatRate).toBeNull();
  });

  it('does not allow negative unit price input', () => {
    component.onLineUnitPriceChange(0, '-5');

    expect(component.lines()[0].unitPrice).toBe(0);
  });

  it('enforces supplier minimum purchase price while typing unit price', () => {
    store.suppliers.set([{ supplierId: 1, supplierName: 'Supplier A', isActive: true }]);
    store.supplierProductsBySupplier.set({
      1: [
        {
          productId: 10,
          productName: 'Paper',
          supplierId: 1,
          unitPrice: 10.5,
          vatRate: 21,
        },
      ],
    });

    component.supplierId.set(1);
    component.lines.set([
      {
        productId: 10,
        productName: 'Paper',
        quantity: 1,
        unitPrice: 12,
        vatRate: 21,
      },
    ]);

    component.onLineUnitPriceChange(0, '9.99');

    expect(component.lines()[0].unitPrice).toBe(10.5);
  });

  it('associates supplier on first selected product and filters product options by that supplier', () => {
    store.suppliers.set([
      { supplierId: 1, supplierName: 'Supplier A', isActive: true },
      { supplierId: 2, supplierName: 'Supplier B', isActive: true },
    ]);

    store.supplierProductsBySupplier.set({
      1: [
        {
          productId: 10,
          productName: 'Paper A4',
          supplierId: 1,
          unitPrice: 5,
          vatRate: 21,
        },
        {
          productId: 11,
          productName: 'Pens',
          supplierId: 1,
          unitPrice: 3,
          vatRate: 21,
        },
      ],
      2: [
        {
          productId: 10,
          productName: 'Paper A4',
          supplierId: 2,
          unitPrice: 6,
          vatRate: 21,
        },
        {
          productId: 20,
          productName: 'Folders',
          supplierId: 2,
          unitPrice: 4,
          vatRate: 21,
        },
      ],
    });

    component.lines.set([]);
    component.supplierId.set(null);

    component.addProductFromPicker(10);

    expect(component.supplierId()).toBe(1);
    expect(component.productOptions().map((option) => option.value)).toEqual([10, 11]);
  });
});

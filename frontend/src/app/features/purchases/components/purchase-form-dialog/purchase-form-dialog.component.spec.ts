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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: PurchasesStore, useValue: new MockPurchasesStore() }],
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

  it('parses decimal values with comma separators', () => {
    component.onLineQuantityChange(0, '10,5');

    expect(component.lines()[0].quantity).toBe(10.5);
  });

  it('parses localized values with thousand separator and decimal comma', () => {
    component.onLineUnitPriceChange(0, '1.234,56');

    expect(component.lines()[0].unitPrice).toBe(1234.56);
  });

  it('sets null when numeric input is invalid', () => {
    component.onLineVatRateChange(0, 'not-a-number');

    expect(component.lines()[0].vatRate).toBeNull();
  });
});

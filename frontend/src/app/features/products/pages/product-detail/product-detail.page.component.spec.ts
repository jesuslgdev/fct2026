import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductsStore } from '@features/products/state/products.store';
import { ProductSuppliersStore } from '@features/supplier-product/state/product-suppliers.store';
import { ProductDetailPageComponent } from './product-detail.page.component';

class MockProductsStore {
  readonly selectedProduct = signal(null);
  readonly error = signal<string | null>(null);
  readonly canEdit = signal(true);

  readonly loadProductById = vi.fn();
  readonly openEditDialog = vi.fn();
}

class MockProductSuppliersStore {
  readonly productPageSize = signal(10);

  readonly loadProductSuppliers = vi.fn();
  readonly onProductPageChange = vi.fn();
  readonly setPriceDraft = vi.fn();
  readonly setAddSupplierPriceDraft = vi.fn();
}

describe('ProductDetailPageComponent', () => {
  let productsStore: MockProductsStore;
  let productSuppliersStore: MockProductSuppliersStore;
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    productsStore = new MockProductsStore();
    productSuppliersStore = new MockProductSuppliersStore();
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ProductDetailPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '12' }) } },
        },
        { provide: Router, useValue: router },
      ],
    })
      .overrideComponent(ProductDetailPageComponent, {
        set: {
          providers: [
            { provide: ProductsStore, useValue: productsStore },
            { provide: ProductSuppliersStore, useValue: productSuppliersStore },
          ],
          template: '<div></div>',
        },
      })
      .compileComponents();
  });

  it('carga producto y proveedores al iniciar', () => {
    const fixture = TestBed.createComponent(ProductDetailPageComponent);

    fixture.detectChanges();

    expect(productsStore.loadProductById).toHaveBeenCalledWith(12);
    expect(productSuppliersStore.loadProductSuppliers).toHaveBeenCalledWith(12);
  });

  it('delega paginacion de proveedores al store', () => {
    const fixture = TestBed.createComponent(ProductDetailPageComponent);
    const component = fixture.componentInstance;

    component.onProductSuppliersPageChange({ first: 20, rows: 10 });

    expect(productSuppliersStore.onProductPageChange).toHaveBeenCalledWith({ first: 20, rows: 10 });
  });

  it('actualiza borrador de precio desde input inline', () => {
    const fixture = TestBed.createComponent(ProductDetailPageComponent);
    const component = fixture.componentInstance;
    const input = document.createElement('input');
    input.value = '24.50';

    component.onSupplierPriceInput({ target: input } as unknown as Event);

    expect(productSuppliersStore.setPriceDraft).toHaveBeenCalledWith('24.50');
  });

  it('actualiza borrador de precio del modal de alta', () => {
    const fixture = TestBed.createComponent(ProductDetailPageComponent);
    const component = fixture.componentInstance;
    const input = document.createElement('input');
    input.value = '31.20';

    component.onAddSupplierPriceInput({ target: input } as unknown as Event);

    expect(productSuppliersStore.setAddSupplierPriceDraft).toHaveBeenCalledWith('31.20');
  });
});

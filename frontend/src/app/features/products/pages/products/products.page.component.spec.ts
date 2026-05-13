import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import type { TablePageEvent } from 'primeng/table';
import { ProductsPageComponent } from './products.page.component';
import { ProductsStore } from '@features/products/state/products.store';
import { signal } from '@angular/core';

class MockProductsStore {
  readonly productsView = signal([]);
  readonly loading = signal(false);
  readonly pageSize = signal(20);
  readonly total = signal(0);
  readonly searchQuery = signal('');
  readonly categoryFilter = signal(null);
  readonly statusFilter = signal(null);
  readonly confirmDialogVisible = signal(false);
  readonly productToToggle = signal(null);
  readonly lowStockProducts = signal([]);
  readonly categories = signal([
    { categoryId: 1, name: 'Categoria 1', description: '' },
    { categoryId: 2, name: 'Categoria 2', description: '' },
  ]);

  readonly canEdit = signal(true);

  readonly loadProducts = vi.fn();
  readonly loadCategories = vi.fn();
  readonly loadLowStockProducts = vi.fn();
  readonly setSearchQuery = vi.fn();
  readonly setCategoryFilter = vi.fn();
  readonly setStatusFilter = vi.fn();
  readonly onPageChange = vi.fn();
  readonly onPageSizeChange = vi.fn();
  readonly openEditDialog = vi.fn();
  readonly openConfirmDialog = vi.fn();
  readonly toggleProductStatus = vi.fn();
  readonly closeConfirmDialog = vi.fn();
}

describe('ProductsPageComponent', () => {
  let store: MockProductsStore;

  beforeEach(async () => {
    store = new MockProductsStore();

    await TestBed.configureTestingModule({
      imports: [ProductsPageComponent],
    })
      .overrideComponent(ProductsPageComponent, {
        set: {
          providers: [{ provide: ProductsStore, useValue: store }],
          template: '<div></div>',
        },
      })
      .compileComponents();
  });

  it('calls load methods on init', () => {
    const fixture = TestBed.createComponent(ProductsPageComponent);
    fixture.detectChanges();

    expect(store.loadProducts).toHaveBeenCalled();
    expect(store.loadCategories).toHaveBeenCalled();
    expect(store.loadLowStockProducts).toHaveBeenCalled();
  });

  it('triggers loadProducts when searching', () => {
    const fixture = TestBed.createComponent(ProductsPageComponent);
    const component = fixture.componentInstance;

    component.onSearch('foo');

    expect(store.setSearchQuery).toHaveBeenCalledWith('foo');
    expect(store.loadProducts).toHaveBeenCalled();
  });

  it('includes an all categories option in the category filter', () => {
    const fixture = TestBed.createComponent(ProductsPageComponent);
    const component = fixture.componentInstance;

    expect(component.categoryFilterOptions()).toEqual([
      { categoryId: null, name: 'Todas las categorias', description: '' },
      { categoryId: 1, name: 'Categoria 1', description: '' },
      { categoryId: 2, name: 'Categoria 2', description: '' },
    ]);
  });

  it('clears the category filter and reloads products', () => {
    const fixture = TestBed.createComponent(ProductsPageComponent);
    const component = fixture.componentInstance;

    component.onCategoryChange(null);

    expect(store.setCategoryFilter).toHaveBeenCalledWith(null);
    expect(store.loadProducts).toHaveBeenCalled();
  });

  it('calls store methods for page changes', async () => {
    const fixture = TestBed.createComponent(ProductsPageComponent);
    const component = fixture.componentInstance;

    component.onPageChange({ first: 20, rows: 20 });
    expect(store.onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageSizeChange when rows value changes', () => {
    const fixture = TestBed.createComponent(ProductsPageComponent);
    const component = fixture.componentInstance;

    component.onPageChange({ first: 0, rows: 50 });

    expect(store.onPageSizeChange).toHaveBeenCalledWith(50);
    expect(store.onPageChange).not.toHaveBeenCalled();
  });

  it('uses safe defaults when page event has missing values', () => {
    const fixture = TestBed.createComponent(ProductsPageComponent);
    const component = fixture.componentInstance;
    const event = {} as unknown as TablePageEvent;

    component.onPageChange(event);

    expect(store.onPageChange).toHaveBeenCalledWith(1);
  });
});

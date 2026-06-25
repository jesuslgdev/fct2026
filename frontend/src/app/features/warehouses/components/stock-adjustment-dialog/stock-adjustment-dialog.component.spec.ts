import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Select } from 'primeng/select';
import { vi } from 'vitest';
import { Product } from '@domain/models/product.model';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import {
  ProductStockOption,
  WarehouseDetailStore,
} from '@features/warehouses/state/warehouse-detail.store';
import { StockAdjustmentDialogComponent } from './stock-adjustment-dialog.component';

const PRODUCT: Product = {
  productId: 20,
  code: 'SKU-20',
  name: 'Producto C',
  description: 'Producto C',
  categoryId: 1,
  categoryName: 'General',
  price: 10,
  vatRate: 0.21,
  stock: 0,
  minStock: 0,
  isActive: true,
};

const PRODUCT_OPTION: ProductStockOption = {
  productId: PRODUCT.productId,
  label: `${PRODUCT.code} - ${PRODUCT.name}`,
  product: PRODUCT,
};

class MockWarehouseDetailStore {
  readonly adjustDialogVisible = signal(true);
  readonly adjustMode = signal<'existing' | 'initial'>('initial');
  readonly adjustDialogError = signal<string | null>(null);
  readonly adjustingStock = signal(false);
  readonly selectedStockItem = signal(null);
  readonly selectedProduct = signal<Product | null>(null);
  readonly productOptions = signal<ProductStockOption[]>([PRODUCT_OPTION]);
  readonly productsLoading = signal(false);
  readonly selectedProductLabel = signal('');

  readonly searchProducts = vi.fn();
  readonly selectProduct = vi.fn();
  readonly confirmAdjustStock = vi.fn();
  readonly closeAdjustDialog = vi.fn();
}

describe('StockAdjustmentDialogComponent', () => {
  let fixture: ComponentFixture<StockAdjustmentDialogComponent>;
  let component: StockAdjustmentDialogComponent;
  let store: MockWarehouseDetailStore;

  beforeEach(async () => {
    store = new MockWarehouseDetailStore();

    await TestBed.configureTestingModule({
      imports: [StockAdjustmentDialogComponent],
      providers: [{ provide: WarehouseDetailStore, useValue: store }],
    })
      .overrideComponent(DialogComponent, {
        set: { template: '<ng-content />' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(StockAdjustmentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders one filterable product select in initial stock mode', () => {
    const selectDebugElements = fixture.debugElement.queryAll(By.directive(Select));

    expect(selectDebugElements).toHaveLength(1);

    const select = selectDebugElements[0].componentInstance as Select;
    expect(select.filter).toBe(true);
    expect(select.filterBy).toBe('label');
    expect(select.filterPlaceholder).toBe('Buscar por nombre de producto');
    expect(select.showClear).toBe(true);
    expect(select.appendTo()).toBe('body');
  });

  it('searches products remotely when the select filter changes', () => {
    component.onProductFilter({ filter: 'Producto C' });

    expect(store.searchProducts).toHaveBeenCalledWith('Producto C');
  });

  it('selects the product when the select value changes', () => {
    component.onProductChange(20);

    expect(store.selectProduct).toHaveBeenCalledWith(20);
  });

  it('keeps confirm disabled when initial stock has no selected product', () => {
    const dialog = fixture.debugElement.query(By.directive(DialogComponent))
      .componentInstance as DialogComponent;

    expect(dialog.confirmDisabled()).toBe(true);
  });
});

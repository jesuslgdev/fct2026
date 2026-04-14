import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { Warehouse } from '@domain/models/warehouse.model';
import { WarehouseDetailStore } from '@features/warehouses/state/warehouse-detail.store';
import { WarehouseDetailPageComponent } from './warehouse-detail.page.component';

class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

const WAREHOUSE: Warehouse = {
  warehouseId: 1,
  name: 'Almacen A',
  address: 'Calle Ficticia 1, Sevilla, Sevilla, 41600',
  addressData: {
    street: 'Calle Ficticia 1',
    city: 'Sevilla',
    province: 'Sevilla',
    postalCode: '41600',
  },
  totalStock: 0,
};

class MockWarehouseDetailStore {
  readonly warehouseId = signal<number | null>(1);
  readonly warehouse = signal<Warehouse | null>(WAREHOUSE);
  readonly stockItems = signal([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly productNameFilter = signal('');
  readonly productOptions = signal([]);
  readonly productSearchQuery = signal('');
  readonly selectedStockItem = signal(null);
  readonly selectedProduct = signal(null);
  readonly adjustMode = signal<'existing' | 'initial'>('existing');
  readonly loadingWarehouse = signal(false);
  readonly loadingStock = signal(false);
  readonly productsLoading = signal(false);
  readonly adjustingStock = signal(false);
  readonly error = signal<string | null>(null);
  readonly stockError = signal<string | null>(null);
  readonly adjustDialogError = signal<string | null>(null);
  readonly adjustDialogVisible = signal(false);
  readonly availableStockItems = signal([]);
  readonly selectedProductLabel = signal('');

  readonly init = vi.fn();
  readonly onStockSearch = vi.fn();
  readonly onStockPageChange = vi.fn();
  readonly openInitialStockDialog = vi.fn();
  readonly openAdjustExistingDialog = vi.fn();
  readonly searchProducts = vi.fn();
  readonly selectProduct = vi.fn();
  readonly confirmAdjustStock = vi.fn();
  readonly closeAdjustDialog = vi.fn();
}

describe('WarehouseDetailPageComponent', () => {
  let fixture: ComponentFixture<WarehouseDetailPageComponent>;
  let component: WarehouseDetailPageComponent;
  let store: MockWarehouseDetailStore;
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    store = new MockWarehouseDetailStore();
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [WarehouseDetailPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1',
              },
            },
          },
        },
        { provide: Router, useValue: router },
      ],
    })
      .overrideComponent(WarehouseDetailPageComponent, {
        set: {
          providers: [{ provide: WarehouseDetailStore, useValue: store }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(WarehouseDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the warehouse summary card', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Detalle de almacen');
    expect(text).toContain('Almacen A');
    expect(text).toContain('Calle Ficticia 1, Sevilla, Sevilla, 41600');
    expect(text).toContain('Sin stock');
    expect(text).toContain('Stock total');
    expect(text).toContain('0');
  });

  it('keeps the back button behavior', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Volver');

    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/warehouses']);
  });

  it('initializes the detail store with the route warehouse id', () => {
    expect(store.init).toHaveBeenCalledWith(1);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { Warehouse } from '@domain/models/warehouse.model';
import { WarehousesStore } from '@features/warehouses/state/warehouses.store';
import { WarehousesPageComponent } from './warehouses.page.component';

const WAREHOUSE: Warehouse = {
  warehouseId: 1,
  name: 'Almacen Central',
  address: 'Calle Principal 123, Madrid, Madrid, 28001',
  addressData: {
    street: 'Calle Principal 123',
    city: 'Madrid',
    province: 'Madrid',
    postalCode: '28001',
  },
  totalStock: 50,
};

class MockWarehousesStore {
  readonly warehouses = signal<Warehouse[]>([WAREHOUSE]);
  readonly filteredWarehouses = signal<Warehouse[]>([WAREHOUSE]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly dialogError = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly selectedWarehouse = signal<Warehouse | null>(null);
  readonly dialogVisible = signal(false);
  readonly dialogMode = signal<'create' | 'edit'>('create');
  readonly confirmDialogVisible = signal(false);
  readonly warehouseToDelete = signal<Warehouse | null>(null);
  readonly canEdit = signal(false);

  readonly loadWarehouses = vi.fn();
  readonly onSearch = vi.fn();
  readonly openCreateDialog = vi.fn();
  readonly openEditDialog = vi.fn();
  readonly saveWarehouse = vi.fn();
  readonly closeDialog = vi.fn();
  readonly requestDeleteWarehouse = vi.fn();
  readonly confirmDeleteWarehouse = vi.fn();
  readonly cancelDeleteWarehouse = vi.fn();
}

describe('WarehousesPageComponent', () => {
  let fixture: ComponentFixture<WarehousesPageComponent>;
  let component: WarehousesPageComponent;
  let router: { navigate: ReturnType<typeof vi.fn> };
  let store: MockWarehousesStore;

  beforeEach(async () => {
    router = { navigate: vi.fn() };
    store = new MockWarehousesStore();

    await TestBed.configureTestingModule({
      imports: [WarehousesPageComponent],
      providers: [
        { provide: Router, useValue: router },
      ],
    })
      .overrideComponent(WarehousesPageComponent, {
        set: {
          providers: [{ provide: WarehousesStore, useValue: store }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(WarehousesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads warehouses on init', () => {
    expect(store.loadWarehouses).toHaveBeenCalledOnce();
  });

  it('navigates to warehouse detail when opening a warehouse', () => {
    component.openWarehouseDetail(WAREHOUSE);

    expect(router.navigate).toHaveBeenCalledWith(['/warehouses', 1]);
  });

  it('navigates to warehouse detail when clicking a warehouse row', () => {
    const row = fixture.debugElement.query(By.css('tbody tr'));

    row.triggerEventHandler('click', new MouseEvent('click'));

    expect(router.navigate).toHaveBeenCalledWith(['/warehouses', 1]);
  });
});

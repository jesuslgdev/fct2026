import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { WarehouseFormDialogComponent } from '@features/warehouses/components/warehouse-form-dialog/warehouse-form-dialog.component';
import { WarehousesStore } from '@features/warehouses/state/warehouses.store';
import { Warehouse } from '@domain/models/warehouse.model';

const WAREHOUSE_MOCK: Warehouse = {
  warehouseId: 10,
  name: 'Almacen Centro',
  address: 'Calle Mayor 10, Madrid',
  totalStock: 0,
};

class MockWarehousesStore {
  readonly selectedWarehouse = signal<Warehouse | null>(null);
  readonly dialogMode = signal<'create' | 'edit'>('create');
  readonly dialogVisible = signal(false);
  readonly loading = signal(false);

  readonly saveWarehouse = vi.fn();
  readonly closeDialog = vi.fn();
}

describe('WarehouseFormDialogComponent', () => {
  let store: MockWarehousesStore;

  beforeEach(async () => {
    store = new MockWarehousesStore();

    await TestBed.configureTestingModule({
      imports: [WarehouseFormDialogComponent],
      providers: [{ provide: WarehousesStore, useValue: store }],
    })
      .overrideComponent(WarehouseFormDialogComponent, {
        set: { template: '<div></div>' },
      })
      .compileComponents();
  });

  it('submits create payload when form is valid in create mode', () => {
    const fixture = TestBed.createComponent(WarehouseFormDialogComponent);
    const component = fixture.componentInstance;
    store.dialogMode.set('create');
    fixture.detectChanges();

    component.form.setValue({
      name: 'Almacen Norte',
      address: 'Poligono 2, Nave 4',
    });

    component.onConfirm();

    expect(store.saveWarehouse).toHaveBeenCalledWith({
      name: 'Almacen Norte',
      address: 'Poligono 2, Nave 4',
    });
  });

  it('submits update payload in edit mode', () => {
    store.dialogMode.set('edit');
    store.selectedWarehouse.set(WAREHOUSE_MOCK);

    const fixture = TestBed.createComponent(WarehouseFormDialogComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({
      name: 'Almacen Centro Actualizado',
      address: 'Calle Mayor 10, Madrid',
    });

    component.onConfirm();

    expect(store.saveWarehouse).toHaveBeenCalledWith({
      name: 'Almacen Centro Actualizado',
      address: 'Calle Mayor 10, Madrid',
    });
  });

  it('does not submit if form is invalid', () => {
    const fixture = TestBed.createComponent(WarehouseFormDialogComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.reset();
    component.onConfirm();

    expect(store.saveWarehouse).not.toHaveBeenCalled();
  });

  it('marks max length violations on name and address', () => {
    const fixture = TestBed.createComponent(WarehouseFormDialogComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.setValue({
      name: 'N'.repeat(101),
      address: 'D'.repeat(256),
    });

    expect(component.name.hasError('maxlength')).toBe(true);
    expect(component.address.hasError('maxlength')).toBe(true);
  });

  it('calls closeDialog on cancel', () => {
    const fixture = TestBed.createComponent(WarehouseFormDialogComponent);
    const component = fixture.componentInstance;

    component.onCancel();

    expect(store.closeDialog).toHaveBeenCalledOnce();
  });
});

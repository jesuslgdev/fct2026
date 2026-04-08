import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ProductFormDialogComponent } from './product-form-dialog.component';
import { ProductsStore } from '@features/products/state/products.store';
import { Product } from '@domain/models/product.model';

const PRODUCT_MOCK: Product = {
  productId: 1,
  code: 'P-0001',
  name: 'Producto prueba',
  description: 'Descripcion',
  categoryId: 1,
  categoryName: 'Categoria',
  price: 10,
  stock: 5,
  minStock: 2,
  isActive: true,
};

class MockProductsStore {
  readonly selectedProduct = signal<Product | null>(null);
  readonly dialogMode = signal<'create' | 'edit' | 'view'>('create');
  readonly categories = signal([{ categoryId: 1, name: 'Cat 1', description: '' }]);
  readonly codeValidationError = signal<string | null>(null);
  readonly loading = signal(false);

  readonly validateProductCode = vi.fn();
  readonly createProduct = vi.fn();
  readonly updateProduct = vi.fn();
  readonly closeDialog = vi.fn();
}

describe('ProductFormDialogComponent', () => {
  let store: MockProductsStore;

  beforeEach(async () => {
    store = new MockProductsStore();

    await TestBed.configureTestingModule({
      imports: [ProductFormDialogComponent],
      providers: [{ provide: ProductsStore, useValue: store }],
    })
      .overrideComponent(ProductFormDialogComponent, {
        set: { template: '<div></div>' },
      })
      .compileComponents();
  });

  it('submits create payload when form is valid in create mode', async () => {
    const fixture = TestBed.createComponent(ProductFormDialogComponent);
    const component = fixture.componentInstance;
    store.dialogMode.set('create');
    fixture.detectChanges();

    component.form.setValue({
      code: 'P-0002',
      name: 'Nombre',
      description: 'Desc',
      categoryId: 1,
      price: 5,
      stock: 10,
      minStock: 2,
    });

    await component.onConfirm();

    expect(store.validateProductCode).toHaveBeenCalledWith('P-0002');
    expect(store.createProduct).toHaveBeenCalledWith({
      code: 'P-0002',
      name: 'Nombre',
      description: 'Desc',
      categoryId: 1,
      price: 5,
      stock: 10,
      minStock: 2,
    });
  });

  it('does not create if code validation fails', async () => {
    store.dialogMode.set('create');
    store.codeValidationError.set('Code exists');

    const fixture = TestBed.createComponent(ProductFormDialogComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.setValue({
      code: 'P-0002',
      name: 'Nombre',
      description: 'Desc',
      categoryId: 1,
      price: 5,
      stock: 10,
      minStock: 2,
    });

    await component.onConfirm();

    expect(store.createProduct).not.toHaveBeenCalled();
  });

  it('submits update payload in edit mode', async () => {
    store.dialogMode.set('edit');
    store.selectedProduct.set(PRODUCT_MOCK);

    const fixture = TestBed.createComponent(ProductFormDialogComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({
      name: 'Producto editado',
      description: 'Desc',
      categoryId: 1,
      price: 20,
      stock: 3,
      minStock: 1,
    });

    await component.onConfirm();

    expect(store.updateProduct).toHaveBeenCalledWith(PRODUCT_MOCK.productId, {
      name: 'Producto editado',
      description: 'Desc',
      categoryId: 1,
      price: 20,
      minStock: 1,
    });
  });

  it('calls closeDialog on cancel', () => {
    const fixture = TestBed.createComponent(ProductFormDialogComponent);
    const component = fixture.componentInstance;

    component.onCancel();

    expect(store.closeDialog).toHaveBeenCalledOnce();
  });
});

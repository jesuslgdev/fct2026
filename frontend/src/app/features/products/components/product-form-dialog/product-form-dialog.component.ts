import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Select } from 'primeng/select';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { ProductsStore } from '@features/products/state/products.store';
import { CreateProductPayload, UpdateProductPayload } from '@domain/models/product.model';

@Component({
  selector: 'app-product-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Select, DialogComponent, InputComponent],
  templateUrl: './product-form-dialog.component.html',
})
export class ProductFormDialogComponent {
  readonly store = inject(ProductsStore);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(32)]],
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    categoryId: [null as number | null, Validators.required],
    price: [0, [Validators.required, Validators.min(0.01)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    minStock: [0, [Validators.required, Validators.min(0)]],
  });

  readonly isViewMode = computed(() => this.store.dialogMode() === 'view');
  readonly isCreateMode = computed(() => this.store.dialogMode() === 'create');
  readonly dialogTitle = computed(() => {
    if (this.store.dialogMode() === 'create') return 'Nuevo producto';
    if (this.store.dialogMode() === 'edit') return 'Editar producto';
    return 'Detalle de producto';
  });

  get code() { return this.form.controls.code; }
  get name() { return this.form.controls.name; }
  get description() { return this.form.controls.description; }
  get categoryId() { return this.form.controls.categoryId; }
  get price() { return this.form.controls.price; }
  get stock() { return this.form.controls.stock; }
  get minStock() { return this.form.controls.minStock; }

  constructor() {
    effect(() => {
      const product = this.store.selectedProduct();
      const mode = this.store.dialogMode();

      if (mode === 'create') {
        this.form.reset({
          code: '',
          name: '',
          description: '',
          categoryId: null,
          price: 0,
          stock: 0,
          minStock: 0,
        });
        this.form.enable({ emitEvent: false });
        this.code.enable({ emitEvent: false });
        return;
      }

      if (product) {
        this.form.patchValue({
          code: product.code,
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          price: product.price,
          stock: product.stock,
          minStock: product.minStock,
        });
      }

      this.code.disable({ emitEvent: false });
      if (mode === 'view') {
        this.form.disable({ emitEvent: false });
      } else {
        this.form.enable({ emitEvent: false });
        this.code.disable({ emitEvent: false });
        this.stock.disable({ emitEvent: false });
      }
    });
  }

  async onConfirm(): Promise<void> {
    if (this.isViewMode()) {
      this.store.closeDialog();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    if (this.isCreateMode()) {
      await this.store.validateProductCode(value.code ?? '');
      if (this.store.codeValidationError()) {
        return;
      }

      const payload: CreateProductPayload = {
        code: value.code ?? '',
        name: value.name ?? '',
        description: value.description ?? '',
        categoryId: value.categoryId ?? 0,
        price: value.price ?? 0,
        stock: value.stock ?? 0,
        minStock: value.minStock ?? 0,
      };
      await this.store.createProduct(payload);
      return;
    }

    const payload: UpdateProductPayload = {
      name: value.name ?? undefined,
      description: value.description ?? undefined,
      categoryId: value.categoryId ?? undefined,
      price: value.price ?? undefined,
      minStock: value.minStock ?? undefined,
    };

    const productId = this.store.selectedProduct()?.productId;
    if (productId) {
      await this.store.updateProduct(productId, payload);
    }
  }

  onCancel(): void {
    this.store.closeDialog();
  }
}

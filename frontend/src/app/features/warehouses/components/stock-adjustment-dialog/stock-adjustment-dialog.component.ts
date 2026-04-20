import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { WarehouseDetailStore } from '@features/warehouses/state/warehouse-detail.store';

interface SelectFilterEvent {
  filter?: string;
}

@Component({
  selector: 'app-stock-adjustment-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    DialogComponent,
    InputNumber,
    Select,
    Textarea,
  ],
  templateUrl: './stock-adjustment-dialog.component.html',
})
export class StockAdjustmentDialogComponent {
  readonly store = inject(WarehouseDetailStore);
  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    newQuantity: [0, [Validators.required, Validators.min(0)]],
    reason: ['', [Validators.maxLength(300)]],
  });

  get newQuantity() { return this.form.controls.newQuantity; }
  get reason() { return this.form.controls.reason; }

  constructor() {
    effect(() => {
      const visible = this.store.adjustDialogVisible();
      const item = this.store.selectedStockItem();

      if (!visible) {
        this.form.reset({ newQuantity: 0, reason: '' });
        return;
      }

      this.form.reset({
        newQuantity: item?.stock ?? 0,
        reason: '',
      });
    });
  }

  onProductFilter(event: SelectFilterEvent): void {
    this.store.searchProducts(event.filter ?? '');
  }

  onProductChange(productId: number | null): void {
    this.store.selectProduct(productId);
  }

  onConfirm(): void {
    if (this.form.invalid || (this.store.adjustMode() === 'initial' && !this.store.selectedProduct())) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.store.confirmAdjustStock(
      value.newQuantity ?? 0,
      value.reason?.trim() || undefined,
    );
  }

  onCancel(): void {
    this.store.closeAdjustDialog();
  }
}

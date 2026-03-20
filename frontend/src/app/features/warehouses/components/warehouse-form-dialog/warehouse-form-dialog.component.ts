import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { WarehousesStore } from '@features/warehouses/state/warehouses.store';
import { CreateWarehousePayload, UpdateWarehousePayload } from '@domain/models/warehouse.model';

@Component({
  selector: 'app-warehouse-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DialogComponent, InputComponent],
  templateUrl: './warehouse-form-dialog.component.html',
})
export class WarehouseFormDialogComponent {
  readonly store = inject(WarehousesStore);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    address: ['', [Validators.required, Validators.maxLength(255)]],
  });

  get name() { return this.form.controls.name; }
  get address() { return this.form.controls.address; }

  constructor() {
    effect(() => {
      const warehouse = this.store.selectedWarehouse();
      const mode = this.store.dialogMode();

      if (mode === 'edit' && warehouse) {
        this.form.patchValue({
          name: warehouse.name,
          address: warehouse.address,
        });
      } else {
        this.form.reset();
      }
    });
  }

  onConfirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    if (this.store.dialogMode() === 'create') {
      const payload: CreateWarehousePayload = {
        name: value.name!.trim(),
        address: value.address!.trim(),
      };
      this.store.saveWarehouse(payload);
      return;
    }

    const payload: UpdateWarehousePayload = {
      name: value.name!.trim(),
      address: value.address!.trim(),
    };
    this.store.saveWarehouse(payload);
  }

  onCancel(): void {
    this.store.closeDialog();
  }
}

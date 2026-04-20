import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
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
  private readonly formBuilder = inject(FormBuilder);

  private readonly nonBlankValidator: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const value = control.value;
    if (typeof value !== 'string') {
      return null;
    }

    return value.trim().length > 0 ? null : { whitespace: true };
  };

  readonly form = this.formBuilder.group({
    name: ['', [Validators.required, this.nonBlankValidator, Validators.maxLength(100)]],
    address: ['', [Validators.required, this.nonBlankValidator, Validators.maxLength(255)]],
    city: ['', [Validators.required, this.nonBlankValidator, Validators.maxLength(100)]],
    province: ['', [Validators.required, this.nonBlankValidator, Validators.maxLength(100)]],
    postalCode: ['', [Validators.required, this.nonBlankValidator, Validators.maxLength(10)]],
  });

  get name() { return this.form.controls.name; }
  get address() { return this.form.controls.address; }
  get city() { return this.form.controls.city; }
  get province() { return this.form.controls.province; }
  get postalCode() { return this.form.controls.postalCode; }

  constructor() {
    effect(() => {
      const warehouse = this.store.selectedWarehouse();
      const mode = this.store.dialogMode();

      if (mode === 'edit' && warehouse) {
        this.form.patchValue({
          name: warehouse.name,
          address: warehouse.addressData.street,
          city: warehouse.addressData.city,
          province: warehouse.addressData.province,
          postalCode: warehouse.addressData.postalCode,
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
        address: {
          street: value.address!.trim(),
          city: value.city!.trim(),
          province: value.province!.trim(),
          postalCode: value.postalCode!.trim(),
        },
      };
      this.store.saveWarehouse(payload);
      return;
    }

    const payload: UpdateWarehousePayload = {
      name: value.name!.trim(),
      address: {
        street: value.address!.trim(),
        city: value.city!.trim(),
        province: value.province!.trim(),
        postalCode: value.postalCode!.trim(),
      },
    };
    this.store.saveWarehouse(payload);
  }

  onCancel(): void {
    this.store.closeDialog();
  }
}

import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { SuppliersStore } from '@features/suppliers/state/suppliers.store';
import { CreateSupplierRequest, UpdateSupplierRequest } from '@domain/models/supplier.model';

@Component({
  selector: 'app-supplier-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DialogComponent, InputComponent],
  templateUrl: './supplier-form-dialog.component.html',
})
export class SupplierFormDialogComponent {
  readonly store = inject(SuppliersStore);
  private readonly fb = inject(FormBuilder);
  readonly renderSelects = signal(true);

  private static readonly TAX_ID_PATTERN = /^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z]|[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J])$/i;
  private static readonly PHONE_PATTERN = /^\+?[\d\s-]{9,20}$/;
  private static readonly POSTAL_CODE_PATTERN = /^\d{5}$/;

  // Typed form using FormBuilder
  readonly form = this.fb.group({
    name: ['', Validators.required],
    taxId: ['', [Validators.required, Validators.pattern(SupplierFormDialogComponent.TAX_ID_PATTERN)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.pattern(SupplierFormDialogComponent.PHONE_PATTERN)],
    address: [''],
    city: [''],
    province: [''],
    postalCode: ['', Validators.pattern(SupplierFormDialogComponent.POSTAL_CODE_PATTERN)],
  });

// Getters for quick access to controls
  get name() { return this.form.controls.name; }
  get taxId() { return this.form.controls.taxId; }
  get email() { return this.form.controls.email; }
  get phone() { return this.form.controls.phone; }
  get address() { return this.form.controls.address; }
  get city() { return this.form.controls.city; }
  get province() { return this.form.controls.province; }
  get postalCode() { return this.form.controls.postalCode; }

  constructor() {
    // Effect: keeps the form in sync when mode/selected supplier changes
    effect(() => {
      const supplier = this.store.selectedSupplier();
      const mode = this.store.dialogMode();

      const addressValidators = mode === 'create' ? [Validators.required] : [];
      const phoneValidators = mode === 'create'
        ? [Validators.required, Validators.pattern(SupplierFormDialogComponent.PHONE_PATTERN)]
        : [Validators.pattern(SupplierFormDialogComponent.PHONE_PATTERN)];
      const postalCodeValidators = mode === 'create'
        ? [Validators.required, Validators.pattern(SupplierFormDialogComponent.POSTAL_CODE_PATTERN)]
        : [Validators.pattern(SupplierFormDialogComponent.POSTAL_CODE_PATTERN)];

      this.phone.setValidators(phoneValidators);
      this.address.setValidators(addressValidators);
      this.city.setValidators(addressValidators);
      this.province.setValidators(addressValidators);
      this.postalCode.setValidators(postalCodeValidators);

      this.phone.updateValueAndValidity({ emitEvent: false });
      this.address.updateValueAndValidity({ emitEvent: false });
      this.city.updateValueAndValidity({ emitEvent: false });
      this.province.updateValueAndValidity({ emitEvent: false });
      this.postalCode.updateValueAndValidity({ emitEvent: false });

      if (mode === 'edit' && supplier) {
        this.form.patchValue({
          name: supplier.name,
          taxId: supplier.taxId,
          email: supplier.email,
          phone: supplier.phone ?? '',
          address: supplier.address ?? '',
          city: supplier.city ?? '',
          province: supplier.province ?? '',
          postalCode: supplier.postalCode ?? '',
        });
      } else {
        this.form.reset({
          name: '',
          taxId: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          province: '',
          postalCode: '',
        });
      }
      // Workaround: force p-select remount to clear internal state
      this.renderSelects.set(false);
      queueMicrotask(() => this.renderSelects.set(true));
    });
  }

  onConfirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const normalizedTaxId = v.taxId?.trim().toUpperCase() ?? '';

    if (this.store.dialogMode() === 'create') {
      const payload: CreateSupplierRequest = {
        name: v.name!,
        taxId: normalizedTaxId,
        email: v.email!,
        phone: v.phone ?? '',
        address: v.address ?? '',
        city: v.city ?? '',
        province: v.province ?? '',
        postalCode: v.postalCode ?? '',
      };
      this.store.saveSupplier(payload);
    } else {
      const payload: UpdateSupplierRequest = {
        name: v.name ?? undefined,
        taxId: normalizedTaxId || undefined,
        email: v.email ?? undefined,
        phone: v.phone || undefined,
        address: v.address || undefined,
        city: v.city || undefined,
        province: v.province || undefined,
        postalCode: v.postalCode || undefined,
      };
      this.store.saveSupplier(payload);
    }
  }

  onCancel(): void {
    this.store.closeDialog();
  }
}


import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { SuppliersStore } from '@features/suppliers/state/suppliers.store';
import { CreateProviderRequest, UpdateProviderRequest } from '@domain/models/provider.model';

@Component({
  selector: 'app-provider-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DialogComponent, InputComponent],
  templateUrl: './provider-form-dialog.component.html',
})
export class ProviderFormDialogComponent {
  readonly store = inject(SuppliersStore);
  private readonly fb = inject(FormBuilder);
  readonly renderSelects = signal(true);

  // Typed form using FormBuilder
  readonly form = this.fb.group({
    name: ['', Validators.required],
    taxId: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    address: [''],
    province: [''],
    postalCode: [''],
    contactPerson: [''],
  });

  // Getters for quick access to controls
  get name() { return this.form.controls.name; }
  get taxId() { return this.form.controls.taxId; }
  get email() { return this.form.controls.email; }
  get phone() { return this.form.controls.phone; }
  get address() { return this.form.controls.address; }
  get province() { return this.form.controls.province; }
  get postalCode() { return this.form.controls.postalCode; }
  get contactPerson() { return this.form.controls.contactPerson; }

  constructor() {
    // Effect: keeps the form in sync when mode/selected provider changes
    effect(() => {
      const provider = this.store.selectedProvider();
      const mode = this.store.dialogMode();
      if (mode === 'edit' && provider) {
        this.form.patchValue({
          name: provider.name,
          taxId: provider.taxId,
          email: provider.email,
          phone: provider.phone ?? '',
          address: provider.address ?? '',
          province: provider.province ?? '',
          postalCode: provider.postalCode ?? '',
          contactPerson: provider.contactPerson ?? '',
        });
      } else {
        this.form.reset();
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

    if (this.store.dialogMode() === 'create') {
      const payload: CreateProviderRequest = {
        name: v.name!,
        taxId: v.taxId!,
        email: v.email!,
        phone: v.phone || undefined,
        address: v.address || undefined,
        province: v.province || undefined,
        postalCode: v.postalCode || undefined,
        contactPerson: v.contactPerson || undefined,
      };
      this.store.saveProvider(payload);
    } else {
      const payload: UpdateProviderRequest = {
        name: v.name ?? undefined,
        taxId: v.taxId ?? undefined,
        email: v.email ?? undefined,
        phone: v.phone || undefined,
        address: v.address || undefined,
        province: v.province || undefined,
        postalCode: v.postalCode || undefined,
        contactPerson: v.contactPerson || undefined,
      };
      this.store.saveProvider(payload);
    }
  }

  onCancel(): void {
    this.store.closeDialog();
  }
}

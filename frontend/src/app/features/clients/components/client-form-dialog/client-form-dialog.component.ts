import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { ClientsStore } from '@features/clients/state/clients.store';
import { CreateClientPayload, UpdateClientPayload } from '@domain/models/client.model';

@Component({
  selector: 'app-client-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DialogComponent, InputComponent],
  templateUrl: './client-form-dialog.component.html',
})
export class ClientFormDialogComponent {
  readonly store = inject(ClientsStore);
  private readonly fb = inject(FormBuilder);
  readonly renderSelects = signal(true);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    taxId: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{8,10}[A-Z]$/i)]],
    address: ['', Validators.required],
    city: ['', Validators.required],
    province: ['', Validators.required],
    postalCode: ['', [Validators.required, Validators.pattern(/^[0-9]{5}$/)]],
    phone: ['', [Validators.required, Validators.pattern(/^[6-9][0-9]{8}$/)]],
    email: ['', [Validators.required, Validators.email]],
  });

  readonly isViewMode = computed(() => this.store.dialogMode() === 'view');

  getDialogTitle(): string {
    const mode = this.store.dialogMode();
    if (mode === 'create') return 'Nuevo cliente';
    if (mode === 'edit') return 'Editar cliente';
    return 'Detalles del cliente';
  }

  get name() { return this.form.controls.name; }
  get taxId() { return this.form.controls.taxId; }
  get address() { return this.form.controls.address; }
  get city() { return this.form.controls.city; }
  get province() { return this.form.controls.province; }
  get postalCode() { return this.form.controls.postalCode; }
  get phone() { return this.form.controls.phone; }
  get email() { return this.form.controls.email; }

  readonly isViewMode = computed(() => this.store.dialogMode() === 'view');

  getDialogTitle(): string {
    const mode = this.store.dialogMode();
    if (mode === 'create') return 'Nuevo cliente';
    if (mode === 'edit') return 'Editar cliente';
    return 'Detalles del cliente';
  }

  constructor() {
    effect(() => {
      const client = this.store.selectedClient();
      const mode = this.store.dialogMode();
      if (client && (mode === 'edit' || mode === 'view')) {
        this.form.patchValue({
          name: client.name,
          taxId: client.taxId,
          address: client.address,
          city: client.city,
          province: client.province,
          postalCode: client.postalCode,
          phone: client.phone,
          email: client.email,
        });
      } else {
        this.form.reset();
      }
      // Force remount of p-select controls to clear stale internal label state
      // after switching between edit/create contexts.
      this.renderSelects.set(false);
      queueMicrotask(() => this.renderSelects.set(true));
    });
  }

  onConfirm(): void {
    if (this.isViewMode()) {
      this.store.closeDialog();
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    if (this.store.dialogMode() === 'create') {
      const payload: CreateClientPayload = {
        name: v.name!,
        taxId: v.taxId!,
        address: v.address!,
        city: v.city!,
        province: v.province!,
        postalCode: v.postalCode!,
        phone: v.phone!,
        email: v.email!,
      };
      this.store.saveClient(payload);
    } else {
      const payload: UpdateClientPayload = {
        name: v.name ?? undefined,
        address: v.address ?? undefined,
        city: v.city ?? undefined,
        province: v.province ?? undefined,
        postalCode: v.postalCode ?? undefined,
        phone: v.phone ?? undefined,
        email: v.email ?? undefined,
      };
      this.store.saveClient(payload);
    }
  }

  onCancel(): void {
    this.store.closeDialog();
  }
}

import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Select } from 'primeng/select';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { UsersStore } from '@features/users/state/users.store';
import { UserRole } from '@domain/enums/user-role.enum';
import { isDepartmentRequiredForRole, CreateUserPayload, UpdateUserPayload } from '@domain/models/user.model';

interface RoleOption { label: string; value: UserRole; }

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Select, DialogComponent, InputComponent],
  templateUrl: './user-form-dialog.component.html',
})
export class UserFormDialogComponent {
  readonly store = inject(UsersStore);
  private readonly fb = inject(FormBuilder);
  readonly renderSelects = signal(true);

  readonly form = this.fb.group({
    firstName:    ['', Validators.required],
    lastName:     ['', Validators.required],
    email:        ['', [Validators.required, Validators.email]],
    role:         [null as UserRole | null, Validators.required],
    departmentId: [null as number | null],
  });

  readonly roleOptions: RoleOption[] = [
    { label: 'Empleado',      value: UserRole.Employee      },
    { label: 'Gerente',       value: UserRole.Manager       },
    { label: 'Administrador', value: UserRole.Administrator },
  ];

  get firstName()    { return this.form.controls.firstName;    }
  get lastName()     { return this.form.controls.lastName;     }
  get email()        { return this.form.controls.email;        }
  get role()         { return this.form.controls.role;         }
  get departmentId() { return this.form.controls.departmentId; }

  readonly roleValue = toSignal(this.role.valueChanges, { initialValue: this.role.value });

  readonly isDepartmentRequired = computed(() => isDepartmentRequiredForRole(this.roleValue()));

  readonly departmentPlaceholder = computed(() => 
    this.isDepartmentRequired()
      ? 'Selecciona un departamento'
      : 'Selecciona un departamento (opcional)'
  );

  constructor() {
    effect(() => {
      if (this.isDepartmentRequired()) {
        this.departmentId.setValidators(Validators.required);
      } else {
        this.departmentId.clearValidators();
      }
      this.departmentId.updateValueAndValidity();
    });

    effect(() => {
      const visible = this.store.dialogVisible();
      const user = this.store.selectedUser();
      const mode = this.store.dialogMode();

      
      if (!visible) return;

      if (mode === 'edit' && user) {
        this.form.patchValue({
          firstName:    user.firstName,
          lastName:     user.lastName,
          role:         user.role,
          departmentId: user.departmentId,
        });
        this.email.clearValidators();
        this.email.updateValueAndValidity();
      } else {
        this.form.reset();
        this.email.setValidators([Validators.required, Validators.email]);
        this.email.updateValueAndValidity();
      }
      // Force remount of p-select controls to clear stale internal label state
      // after switching between edit/create contexts.
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
      const payload: CreateUserPayload = {
        firstName:    v.firstName!,
        lastName:     v.lastName!,
        email:        v.email!,
        role:         v.role!,
        departmentId: v.departmentId,
      };
      this.store.saveUser(payload);
    } else {
      const payload: UpdateUserPayload = {
        firstName:    v.firstName    ?? undefined,
        lastName:     v.lastName     ?? undefined,
        role:         v.role         ?? undefined,
        departmentId: v.departmentId ?? undefined,
      };
      this.store.saveUser(payload);
    }
  }

  onCancel(): void {
    this.store.closeDialog();
  }
}

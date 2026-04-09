import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { UsersStore } from '@features/users/state/users.store';
import { ActivateUserPayload } from '@domain/models/user.model';

@Component({
  selector: 'app-user-reactivate-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DialogComponent, InputComponent],
  templateUrl: './user-reactivate-dialog.component.html',
})
export class UserReactivateDialogComponent {
  readonly store = inject(UsersStore);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  get firstName() {
    return this.form.controls.firstName;
  }

  get lastName() {
    return this.form.controls.lastName;
  }

  get email() {
    return this.form.controls.email;
  }

  constructor() {
    effect(() => {
      const visible = this.store.reactivateDialogVisible();
      const user = this.store.userToToggle();

      if (!visible || !user) {
        return;
      }

      this.form.reset({
        firstName: user.firstName,
        lastName: user.lastName ?? '',
        email: user.email ?? '',
      });
      this.form.markAsPristine();
      this.form.markAsUntouched();
    });
  }

  onConfirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: ActivateUserPayload = {
      firstName: value.firstName!,
      lastName: value.lastName!,
      email: value.email!,
    };

    this.store.confirmReactivateUser(payload);
  }

  onCancel(): void {
    this.store.cancelToggleStatus();
    this.form.reset();
  }
}

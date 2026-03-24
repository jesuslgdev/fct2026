import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { UserFormDialogComponent } from '@features/users/components/user-form-dialog/user-form-dialog.component';
import { UsersStore } from '@features/users/state/users.store';
import { User } from '@domain/models/user.model';

const USER_MOCK: User = {
  id: 10,
  firstName: 'Elena',
  lastName: 'Ruiz',
  email: 'elena@example.com',
  role: 'Administrator',
  departmentId: 2,
  active: true,
};

class MockUsersStore {
  readonly selectedUser = signal<User | null>(null);
  readonly dialogMode = signal<'create' | 'edit'>('create');
  readonly departments = signal([
    { id: 1, name: 'Tecnologia' },
    { id: 2, name: 'Ventas' },
  ]);

  readonly saveUser = vi.fn();
  readonly closeDialog = vi.fn();
}

describe('UserFormDialogComponent', () => {
  let store: MockUsersStore;

  beforeEach(async () => {
    store = new MockUsersStore();

    await TestBed.configureTestingModule({
      imports: [UserFormDialogComponent],
      providers: [{ provide: UsersStore, useValue: store }],
    })
      .overrideComponent(UserFormDialogComponent, {
        set: { template: '<div></div>' },
      })
      .compileComponents();
  });

  it('submits create payload when form is valid in create mode', () => {
    const fixture = TestBed.createComponent(UserFormDialogComponent);
    const component = fixture.componentInstance;
    store.dialogMode.set('create');
    fixture.detectChanges();

    component.form.setValue({
      firstName: 'Ana',
      lastName: 'Garcia',
      email: 'ana@example.com',
      role: 'Manager',
      departmentId: 1,
    });

    component.onConfirm();

    expect(store.saveUser).toHaveBeenCalledWith({
      firstName: 'Ana',
      lastName: 'Garcia',
      email: 'ana@example.com',
      role: 'Manager',
      departmentId: 1,
    });
  });

  it('submits update payload in edit mode', () => {
    store.dialogMode.set('edit');
    store.selectedUser.set(USER_MOCK);

    const fixture = TestBed.createComponent(UserFormDialogComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({
      firstName: 'Elena Maria',
      lastName: 'Ruiz',
      role: 'Administrator',
      departmentId: 2,
    });

    component.onConfirm();

    expect(store.saveUser).toHaveBeenCalledWith({
      firstName: 'Elena Maria',
      lastName: 'Ruiz',
      role: 'Administrator',
      departmentId: 2,
    });
  });

  it('does not submit if form is invalid', () => {
    const fixture = TestBed.createComponent(UserFormDialogComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.reset();
    component.onConfirm();

    expect(store.saveUser).not.toHaveBeenCalled();
  });

  it('calls closeDialog on cancel', () => {
    const fixture = TestBed.createComponent(UserFormDialogComponent);
    const component = fixture.componentInstance;

    component.onCancel();

    expect(store.closeDialog).toHaveBeenCalledOnce();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ClientFormDialogComponent } from './client-form-dialog.component';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { ClientsStore } from '@features/clients/state/clients.store';
import { vi } from 'vitest';

interface MockStore {
  dialogVisible: ReturnType<typeof vi.fn>;
  dialogMode: ReturnType<typeof vi.fn>;
  selectedClient: ReturnType<typeof vi.fn>;
  saveClient: ReturnType<typeof vi.fn>;
  closeDialog: ReturnType<typeof vi.fn>;
}

describe('ClientFormDialogComponent', () => {
  let component: ClientFormDialogComponent;
  let fixture: ComponentFixture<ClientFormDialogComponent>;
  let mockStore: MockStore;

  beforeEach(async () => {
    mockStore = {
      dialogVisible: vi.fn().mockReturnValue(false),
      dialogMode: vi.fn().mockReturnValue('create' as const),
      selectedClient: vi.fn().mockReturnValue(null),
      saveClient: vi.fn(),
      closeDialog: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        ClientFormDialogComponent,
        ReactiveFormsModule,
        DialogComponent,
        InputComponent,
      ],
      providers: [
        { provide: ClientsStore, useValue: mockStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientFormDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with required fields', () => {
    expect(component.form.contains('name')).toBe(true);
    expect(component.form.contains('taxId')).toBe(true);
    expect(component.form.contains('address')).toBe(true);
    expect(component.form.contains('city')).toBe(true);
    expect(component.form.contains('province')).toBe(true);
    expect(component.form.contains('postalCode')).toBe(true);
    expect(component.form.contains('phone')).toBe(true);
    expect(component.form.contains('email')).toBe(true);
  });

  it('should validate required fields', () => {
    component.form.patchValue({
      name: '',
      taxId: '',
      address: '',
      city: '',
      province: '',
      postalCode: '',
      phone: '',
      email: '',
    });
    component.form.markAllAsTouched();

    expect(component.form.valid).toBe(false);
    expect(component.name.invalid).toBe(true);
    expect(component.taxId.invalid).toBe(true);
    expect(component.address.invalid).toBe(true);
  });

  it('should validate tax ID format', () => {
    component.form.patchValue({ taxId: 'INVALID' });
    component.form.markAllAsTouched();

    expect(component.taxId.invalid).toBe(true);
  });

  it('should validate valid tax ID format', () => {
    component.form.patchValue({ taxId: '12345678A' });
    component.form.markAllAsTouched();

    expect(component.taxId.valid).toBe(true);
  });

  it('should validate email format', () => {
    component.form.patchValue({ email: 'invalid-email' });
    component.form.markAllAsTouched();

    expect(component.email.invalid).toBe(true);
  });

  it('should validate valid email format', () => {
    component.form.patchValue({ email: 'test@example.com' });
    component.form.markAllAsTouched();

    expect(component.email.valid).toBe(true);
  });

  it('should call saveClient with create payload on confirm', () => {
    mockStore.dialogMode.mockReturnValue('create');
    component.form.patchValue({
      name: 'Test Client',
      taxId: '12345678A',
      address: 'Test Address',
      city: 'Test City',
      province: 'Test Province',
      postalCode: '12345',
      phone: '600000000',
      email: 'test@example.com',
    });

    component.onConfirm();

    expect(mockStore.saveClient).toHaveBeenCalledWith({
      name: 'Test Client',
      taxId: '12345678A',
      address: 'Test Address',
      city: 'Test City',
      province: 'Test Province',
      postalCode: '12345',
      phone: '600000000',
      email: 'test@example.com',
    });
  });

  it('should call saveClient with update payload on edit', () => {
    mockStore.dialogMode.mockReturnValue('edit');
    component.form.patchValue({
      name: 'Updated Client',
      taxId: '12345678A',
      address: 'Updated Address',
      city: 'Test City',
      province: 'Test Province',
      postalCode: '12345',
      phone: '600000000',
      email: 'test@example.com',
    });

    component.onConfirm();

    expect(mockStore.saveClient).toHaveBeenCalledWith({
      name: 'Updated Client',
      address: 'Updated Address',
      city: 'Test City',
      province: 'Test Province',
      postalCode: '12345',
      phone: '600000000',
      email: 'test@example.com',
    });
  });

  it('should call closeDialog on cancel', () => {
    component.onCancel();

    expect(mockStore.closeDialog).toHaveBeenCalled();
  });

  it('should mark form as touched on invalid confirm', () => {
    component.form.patchValue({ name: '' });
    const markAllAsTouchedSpy = vi.spyOn(component.form, 'markAllAsTouched');

    component.onConfirm();

    expect(markAllAsTouchedSpy).toHaveBeenCalled();
    expect(mockStore.saveClient).not.toHaveBeenCalled();
  });
});

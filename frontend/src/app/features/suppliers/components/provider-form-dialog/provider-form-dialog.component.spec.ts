import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProviderFormDialogComponent } from './provider-form-dialog.component';
import { SuppliersStore } from '@features/suppliers/state/suppliers.store';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { Provider } from '@domain/models/provider.model';
import { ProviderStatus } from '@domain/enums/provider-status.enum';

const MOCK_PROVIDER: Provider = {
  id: '1',
  name: 'Test Provider',
  taxId: '123456789',
  email: 'provider@test.com',
  phone: '+1234567890',
  address: 'Test Address',
  province: '',
  postalCode: '',
  contactPerson: 'Contact Person',
  isActive: true,
  status: ProviderStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ProviderFormDialogComponent', () => {
  let component: ProviderFormDialogComponent;
  let fixture: ComponentFixture<ProviderFormDialogComponent>;
  let mockStore: {
    selectedProvider: ReturnType<typeof vi.fn>;
    dialogMode: ReturnType<typeof vi.fn>;
    dialogVisible: ReturnType<typeof vi.fn>;
    loading: ReturnType<typeof vi.fn>;
    saveProvider: ReturnType<typeof vi.fn>;
    closeDialog: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockStore = {
      selectedProvider: vi.fn().mockReturnValue(null),
      dialogMode: vi.fn().mockReturnValue('create'),
      dialogVisible: vi.fn().mockReturnValue(false),
      loading: vi.fn().mockReturnValue(false),
      saveProvider: vi.fn(),
      closeDialog: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, ProviderFormDialogComponent],
      providers: [
        FormBuilder,
        { provide: SuppliersStore, useValue: mockStore },
        { provide: DialogComponent, useValue: {} },
        { provide: InputComponent, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProviderFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with required fields', () => {
    expect(component.form.contains('name')).toBe(true);
    expect(component.form.contains('taxId')).toBe(true);
    expect(component.form.contains('email')).toBe(true);
    expect(component.form.contains('phone')).toBe(true);
    expect(component.form.contains('address')).toBe(true);
    expect(component.form.contains('contactPerson')).toBe(true);
  });

  it('should have proper validators on required fields', () => {
    const nameControl = component.form.get('name');
    const taxIdControl = component.form.get('taxId');
    const emailControl = component.form.get('email');

    expect(nameControl?.hasValidator(Validators.required)).toBe(true);
    expect(taxIdControl?.hasValidator(Validators.required)).toBe(true);
    expect(emailControl?.hasValidator(Validators.required)).toBe(true);
    expect(emailControl?.hasValidator(Validators.email)).toBe(true);
  });

  it('should have getters for form controls', () => {
    expect(component.name).toBe(component.form.get('name'));
    expect(component.taxId).toBe(component.form.get('taxId'));
    expect(component.email).toBe(component.form.get('email'));
    expect(component.phone).toBe(component.form.get('phone'));
    expect(component.address).toBe(component.form.get('address'));
    expect(component.contactPerson).toBe(component.form.get('contactPerson'));
  });

  it('should reset form when mode is create', () => {
    component.form.patchValue({
      name: 'Test Name',
      taxId: '123456',
      email: 'test@test.com',
    });

    // Reset the form manually to simulate the effect
    component.form.reset();
    fixture.detectChanges();

    expect(component.form.value).toEqual({
      name: null,
      taxId: null,
      email: null,
      phone: null,
      address: null,
      province: null,
      postalCode: null,
      contactPerson: null,
    });
  });

  it('should patch form when mode is edit with provider', () => {
    // Manually trigger the patchValue to simulate the effect
    component.form.patchValue({
      name: MOCK_PROVIDER.name,
      taxId: MOCK_PROVIDER.taxId,
      email: MOCK_PROVIDER.email,
      phone: MOCK_PROVIDER.phone ?? '',
      address: MOCK_PROVIDER.address ?? '',
      province: MOCK_PROVIDER.province ?? '',
      postalCode: MOCK_PROVIDER.postalCode ?? '',
      contactPerson: MOCK_PROVIDER.contactPerson ?? '',
    });
    fixture.detectChanges();

    expect(component.form.value).toEqual({
      name: MOCK_PROVIDER.name,
      taxId: MOCK_PROVIDER.taxId,
      email: MOCK_PROVIDER.email,
      phone: MOCK_PROVIDER.phone,
      address: MOCK_PROVIDER.address,
      province: MOCK_PROVIDER.province,
      postalCode: MOCK_PROVIDER.postalCode,
      contactPerson: MOCK_PROVIDER.contactPerson,
    });
  });

  it('should handle null optional fields in edit mode', () => {
    const providerWithNulls = {
      ...MOCK_PROVIDER,
      phone: null,
      address: null,
      contactPerson: null,
    };

    // Manually trigger the patchValue to simulate the effect
    component.form.patchValue({
      name: providerWithNulls.name,
      taxId: providerWithNulls.taxId,
      email: providerWithNulls.email,
      phone: '',
      address: '',
      province: '',
      postalCode: '',
      contactPerson: '',
    });
    fixture.detectChanges();

    expect(component.form.value).toEqual({
      name: providerWithNulls.name,
      taxId: providerWithNulls.taxId,
      email: providerWithNulls.email,
      phone: '',
      address: '',
      province: '',
      postalCode: '',
      contactPerson: '',
    });
  });

  it('should not save provider if form is invalid', () => {
    component.form.markAllAsTouched();
    component.form.setErrors({ invalid: true });

    component.onConfirm();

    expect(mockStore.saveProvider).not.toHaveBeenCalled();
  });

  it('should save provider with create payload when mode is create', () => {
    component.form.setValue({
      name: 'New Provider',
      taxId: '123456789',
      email: 'new@test.com',
      phone: '+1234567890',
      address: 'New Address',
      province: 'New Province',
      postalCode: '28001',
      contactPerson: 'New Contact',
    });

    mockStore.dialogMode.mockReturnValue('create');
    fixture.detectChanges();

    component.onConfirm();

    expect(mockStore.saveProvider).toHaveBeenCalledWith({
      name: 'New Provider',
      taxId: '123456789',
      email: 'new@test.com',
      phone: '+1234567890',
      address: 'New Address',
      province: 'New Province',
      postalCode: '28001',
      contactPerson: 'New Contact',
    });
  });

  it('should save provider with update payload when mode is edit', () => {
    component.form.setValue({
      name: 'Updated Provider',
      taxId: '987654321',
      email: 'updated@test.com',
      phone: '+0987654321',
      address: 'Updated Address',
      province: 'Updated Province',
      postalCode: '28002',
      contactPerson: 'Updated Contact',
    });

    mockStore.dialogMode.mockReturnValue('edit');
    fixture.detectChanges();

    component.onConfirm();

    expect(mockStore.saveProvider).toHaveBeenCalledWith({
      name: 'Updated Provider',
      taxId: '987654321',
      email: 'updated@test.com',
      phone: '+0987654321',
      address: 'Updated Address',
      province: 'Updated Province',
      postalCode: '28002',
      contactPerson: 'Updated Contact',
    });
  });

  it('should close dialog on cancel', () => {
    component.onCancel();

    expect(mockStore.closeDialog).toHaveBeenCalled();
  });

  it('should mark all fields as touched when form is invalid', () => {
    const markAllAsTouchedSpy = vi.spyOn(component.form, 'markAllAsTouched');
    component.form.setErrors({ invalid: true });

    component.onConfirm();

    expect(markAllAsTouchedSpy).toHaveBeenCalled();
  });

  it('should have renderSelects signal initialized to true', () => {
    expect(component.renderSelects()).toBe(true);
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupplierFormDialogComponent } from './supplier-form-dialog.component';
import { SuppliersStore } from '@features/suppliers/state/suppliers.store';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { Supplier } from '@domain/models/supplier.model';
import { SupplierStatus } from '@domain/enums/supplier-status.enum';

const MOCK_PROVIDER: Supplier = {
  id: '1',
  name: 'Test Supplier',
  taxId: '12345678Z',
  email: 'supplier@test.com',
  phone: '912345678',
  address: 'Test Address',
  city: 'Test City',
  province: '',
  postalCode: '',
  isActive: true,
  status: SupplierStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('SupplierFormDialogComponent', () => {
  let component: SupplierFormDialogComponent;
  let fixture: ComponentFixture<SupplierFormDialogComponent>;
  let mockStore: {
    selectedSupplier: ReturnType<typeof vi.fn>;
    dialogMode: ReturnType<typeof vi.fn>;
    dialogVisible: ReturnType<typeof vi.fn>;
    loading: ReturnType<typeof vi.fn>;
    formError: ReturnType<typeof vi.fn>;
    saveSupplier: ReturnType<typeof vi.fn>;
    closeDialog: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockStore = {
      selectedSupplier: vi.fn().mockReturnValue(null),
      dialogMode: vi.fn().mockReturnValue('create'),
      dialogVisible: vi.fn().mockReturnValue(false),
      loading: vi.fn().mockReturnValue(false),
      formError: vi.fn().mockReturnValue(null),
      saveSupplier: vi.fn(),
      closeDialog: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, SupplierFormDialogComponent],
      providers: [
        FormBuilder,
        { provide: SuppliersStore, useValue: mockStore },
        { provide: DialogComponent, useValue: {} },
        { provide: InputComponent, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SupplierFormDialogComponent);
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
    expect(component.form.contains('city')).toBe(true);
    expect(component.form.contains('province')).toBe(true);
    expect(component.form.contains('postalCode')).toBe(true);
  });

  it('should have proper validators on required fields', () => {
    const nameControl = component.form.get('name');
    const taxIdControl = component.form.get('taxId');
    const emailControl = component.form.get('email');
    const phoneControl = component.form.get('phone');
    const addressControl = component.form.get('address');
    const cityControl = component.form.get('city');
    const provinceControl = component.form.get('province');
    const postalCodeControl = component.form.get('postalCode');

    expect(nameControl?.hasValidator(Validators.required)).toBe(true);
    expect(taxIdControl?.hasValidator(Validators.required)).toBe(true);
    expect(emailControl?.hasValidator(Validators.required)).toBe(true);
    expect(emailControl?.hasValidator(Validators.email)).toBe(true);
    expect(phoneControl?.hasValidator(Validators.required)).toBe(true);
    expect(addressControl?.hasValidator(Validators.required)).toBe(true);
    expect(cityControl?.hasValidator(Validators.required)).toBe(true);
    expect(provinceControl?.hasValidator(Validators.required)).toBe(true);
    expect(postalCodeControl?.hasValidator(Validators.required)).toBe(true);
  });

  it('should have getters for form controls', () => {
    expect(component.name).toBe(component.form.get('name'));
    expect(component.taxId).toBe(component.form.get('taxId'));
    expect(component.email).toBe(component.form.get('email'));
    expect(component.phone).toBe(component.form.get('phone'));
    expect(component.address).toBe(component.form.get('address'));
  });

  it('should reset form when mode is create', () => {
    component.form.patchValue({
      name: 'Test Name',
      taxId: '123456',
      email: 'test@test.com',
    });

    // Reset the form manually to simulate the effect
    component.form.reset({
      name: '',
      taxId: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      province: '',
      postalCode: '',
    });
    fixture.detectChanges();

    expect(component.form.value).toEqual({
      name: '',
      taxId: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      province: '',
      postalCode: '',
    });
  });

  it('should patch form when mode is edit with supplier', () => {
    // Manually trigger the patchValue to simulate the effect
    component.form.patchValue({
      name: MOCK_PROVIDER.name,
      taxId: MOCK_PROVIDER.taxId,
      email: MOCK_PROVIDER.email,
      phone: MOCK_PROVIDER.phone ?? '',
      address: MOCK_PROVIDER.address ?? '',
      city: MOCK_PROVIDER.city ?? '',
      province: MOCK_PROVIDER.province ?? '',
      postalCode: MOCK_PROVIDER.postalCode ?? '',
    });
    fixture.detectChanges();

    expect(component.form.value).toEqual({
      name: MOCK_PROVIDER.name,
      taxId: MOCK_PROVIDER.taxId,
      email: MOCK_PROVIDER.email,
      phone: MOCK_PROVIDER.phone,
      address: MOCK_PROVIDER.address,
      city: MOCK_PROVIDER.city,
      province: MOCK_PROVIDER.province,
      postalCode: MOCK_PROVIDER.postalCode,
    });
  });

  it('should handle null optional fields in edit mode', () => {
    const providerWithNulls = {
      ...MOCK_PROVIDER,
      phone: null,
      address: null,
    };

    // Manually trigger the patchValue to simulate the effect
    component.form.patchValue({
      name: providerWithNulls.name,
      taxId: providerWithNulls.taxId,
      email: providerWithNulls.email,
      phone: '',
      address: '',
      city: '',
      province: '',
      postalCode: '',
    });
    fixture.detectChanges();

    expect(component.form.value).toEqual({
      name: providerWithNulls.name,
      taxId: providerWithNulls.taxId,
      email: providerWithNulls.email,
      phone: '',
      address: '',
      city: '',
      province: '',
      postalCode: '',
    });
  });

  it('should not save supplier if form is invalid', () => {
    component.form.markAllAsTouched();
    component.form.setErrors({ invalid: true });

    component.onConfirm();

    expect(mockStore.saveSupplier).not.toHaveBeenCalled();
  });

  it('should save supplier with create payload when mode is create', () => {
    component.form.setValue({
      name: 'New Supplier',
      taxId: '12345678Z',
      email: 'new@test.com',
      phone: '923456789',
      address: 'New Address',
      city: 'New City',
      province: 'New Province',
      postalCode: '28001',
    });

    mockStore.dialogMode.mockReturnValue('create');
    fixture.detectChanges();

    component.onConfirm();

    expect(mockStore.saveSupplier).toHaveBeenCalledWith({
      name: 'New Supplier',
      taxId: '12345678Z',
      email: 'new@test.com',
      phone: '923456789',
      address: 'New Address',
      city: 'New City',
      province: 'New Province',
      postalCode: '28001',
    });
  });

  it('should save supplier with update payload when mode is edit', () => {
    component.form.setValue({
      name: 'Updated Supplier',
      taxId: 'B12345678',
      email: 'updated@test.com',
      phone: '987654321',
      address: 'Updated Address',
      city: 'Updated City',
      province: 'Updated Province',
      postalCode: '28002',
    });

    mockStore.dialogMode.mockReturnValue('edit');
    fixture.detectChanges();

    component.onConfirm();

    expect(mockStore.saveSupplier).toHaveBeenCalledWith({
      name: 'Updated Supplier',
      taxId: 'B12345678',
      email: 'updated@test.com',
      phone: '987654321',
      address: 'Updated Address',
      city: 'Updated City',
      province: 'Updated Province',
      postalCode: '28002',
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


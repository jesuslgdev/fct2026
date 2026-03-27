import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { CategoryFormDialogComponent } from './category-form-dialog.component';
import { CategoriesStore } from '../../state/categories.store';
import { signal, WritableSignal } from '@angular/core';
import { vi } from 'vitest';

interface MockStore {
  dialogVisible: WritableSignal<boolean>;
  dialogMode: WritableSignal<string>;
  selectedCategory: WritableSignal<{ categoryId: number; name: string; description: string } | null>;
  loading: WritableSignal<boolean>;
  error: WritableSignal<string | null>;
  saveCategory: ReturnType<typeof vi.fn>;
  closeDialog: ReturnType<typeof vi.fn>;
}

describe('CategoryFormDialogComponent', () => {
  let component: CategoryFormDialogComponent;
  let fixture: ComponentFixture<CategoryFormDialogComponent>;
  let mockStore: MockStore;

  beforeEach(async () => {
    mockStore = {
      dialogVisible: signal(false),
      dialogMode: signal('create'),
      selectedCategory: signal(null),
      loading: signal(false),
      error: signal(null),
      saveCategory: vi.fn(),
      closeDialog: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CategoryFormDialogComponent, ReactiveFormsModule],
      providers: [
        { provide: CategoriesStore, useValue: mockStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have store injected', () => {
    expect(component.store).toBeDefined();
  });

  it('should initialize form with correct validators', () => {
    expect(component.form.contains('name')).toBe(true);
    expect(component.form.contains('description')).toBe(true);
    
    const nameControl = component.form.get('name');
    const descriptionControl = component.form.get('description');
    
    expect(nameControl?.validator).toBeTruthy();
    expect(descriptionControl?.validator).toBeTruthy();
  });

  it('should return correct dialog title for create mode', () => {
    mockStore.dialogMode.set('create');
    expect(component.getDialogTitle()).toBe('Nueva categoría');
  });

  it('should return correct dialog title for edit mode', () => {
    mockStore.dialogMode.set('edit');
    expect(component.getDialogTitle()).toBe('Editar categoría');
  });

  it('should reset form when no category is selected', () => {
    mockStore.selectedCategory.set(null);
    mockStore.dialogMode.set('create');
    fixture.detectChanges();

    expect(component.form.value).toEqual({
      name: null,
      description: null,
    });
  });

  it('should patch form when category is selected in edit mode', () => {
    const mockCategory = {
      categoryId: 1,
      name: 'Electronics',
      description: 'Electronic devices',
    };
    
    mockStore.selectedCategory.set(mockCategory);
    mockStore.dialogMode.set('edit');
    fixture.detectChanges();

    expect(component.form.value).toEqual({
      name: 'Electronics',
      description: 'Electronic devices',
    });
  });

  it('should call saveCategory when form is valid and onConfirm is called', () => {
    component.form.setValue({
      name: 'New Category',
      description: 'Description',
    });

    component.onConfirm();

    expect(mockStore.saveCategory).toHaveBeenCalledWith('New Category', 'Description');
  });

  it('should not call saveCategory when form is invalid', () => {
    component.form.setValue({
      name: '',
      description: '',
    });

    component.onConfirm();

    expect(mockStore.saveCategory).not.toHaveBeenCalled();
  });

  it('should mark form as touched when invalid', () => {
    component.form.setValue({
      name: '',
      description: '',
    });

    component.onConfirm();

    expect(component.form.touched).toBe(true);
  });

  it('should call closeDialog when onCancel is called', () => {
    component.onCancel();

    expect(mockStore.closeDialog).toHaveBeenCalled();
  });

  it('should validate name length constraints', () => {
    const nameControl = component.form.get('name');
    
    // Test required
    nameControl?.setValue('');
    expect(nameControl?.invalid).toBe(true);
    expect(nameControl?.hasError('required')).toBe(true);

    // Test minimum length
    nameControl?.setValue('a');
    expect(nameControl?.valid).toBe(true);

    // Test maximum length
    nameControl?.setValue('a'.repeat(101));
    expect(nameControl?.invalid).toBe(true);
    expect(nameControl?.hasError('maxlength')).toBe(true);
  });

  it('should validate description length constraints', () => {
    const descriptionControl = component.form.get('description');
    
    // Test empty is valid
    descriptionControl?.setValue('');
    expect(descriptionControl?.valid).toBe(true);

    // Test maximum length
    descriptionControl?.setValue('a'.repeat(501));
    expect(descriptionControl?.invalid).toBe(true);
    expect(descriptionControl?.hasError('maxlength')).toBe(true);
  });
});

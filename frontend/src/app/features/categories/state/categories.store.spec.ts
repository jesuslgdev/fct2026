import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CategoriesStore } from './categories.store';
import { AuthService } from '@core/services/auth.service';
import { GetCategoriesUseCase } from '@domain/usecases/category/get-categories.usecase';
import { GetCategoryByIdUseCase } from '@domain/usecases/category/get-category-by-id.usecase';
import { CreateCategoryUseCase } from '@domain/usecases/category/create-category.usecase';
import { UpdateCategoryUseCase } from '@domain/usecases/category/update-category.usecase';
import { DeleteCategoryUseCase } from '@domain/usecases/category/delete-category.usecase';
import {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '@domain/models/category.model';
import { UserRole } from '@domain/enums/user-role.enum';

const CATEGORY_A: Category = {
  categoryId: 1,
  name: 'Electronics',
  description: 'Electronic devices',
};

const CATEGORY_B: Category = {
  categoryId: 2,
  name: 'Books',
  description: 'Printed books',
};

class MockAuthService {
  readonly user = signal({
    uid: 'uid-1',
    email: 'admin@example.com',
    displayName: 'Admin',
    photoURL: null,
    role: UserRole.Administrator as const,
  });
}

class MockGetCategoriesUseCase {
  execute = vi.fn<() => Promise<Category[]>>();
}

class MockGetCategoryByIdUseCase {
  execute = vi.fn<(id: number) => Promise<Category>>();
}

class MockCreateCategoryUseCase {
  execute = vi.fn<(payload: CreateCategoryPayload) => Promise<Category>>();
}

class MockUpdateCategoryUseCase {
  execute = vi.fn<(id: number, payload: UpdateCategoryPayload) => Promise<Category>>();
}

class MockDeleteCategoryUseCase {
  execute = vi.fn<(id: number) => Promise<void>>();
}

describe('CategoriesStore', () => {
  let store: CategoriesStore;
  let getCategoriesUseCase: MockGetCategoriesUseCase;
  let getCategoryByIdUseCase: MockGetCategoryByIdUseCase;
  let createCategoryUseCase: MockCreateCategoryUseCase;
  let updateCategoryUseCase: MockUpdateCategoryUseCase;
  let deleteCategoryUseCase: MockDeleteCategoryUseCase;

  beforeEach(() => {
    getCategoriesUseCase = new MockGetCategoriesUseCase();
    getCategoryByIdUseCase = new MockGetCategoryByIdUseCase();
    createCategoryUseCase = new MockCreateCategoryUseCase();
    updateCategoryUseCase = new MockUpdateCategoryUseCase();
    deleteCategoryUseCase = new MockDeleteCategoryUseCase();

    TestBed.configureTestingModule({
      providers: [
        CategoriesStore,
        { provide: AuthService, useValue: new MockAuthService() },
        { provide: GetCategoriesUseCase, useValue: getCategoriesUseCase },
        { provide: GetCategoryByIdUseCase, useValue: getCategoryByIdUseCase },
        { provide: CreateCategoryUseCase, useValue: createCategoryUseCase },
        { provide: UpdateCategoryUseCase, useValue: updateCategoryUseCase },
        { provide: DeleteCategoryUseCase, useValue: deleteCategoryUseCase },
      ],
    });

    store = TestBed.inject(CategoriesStore);
  });

  it('loads categories successfully', async () => {
    const list = [CATEGORY_A, CATEGORY_B];
    getCategoriesUseCase.execute.mockResolvedValueOnce(list);

    await store.loadCategories();

    expect(getCategoriesUseCase.execute).toHaveBeenCalled();
    expect(store.categories()).toEqual(list);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('handles load categories error', async () => {
    getCategoriesUseCase.execute.mockRejectedValueOnce(new Error('Failed load'));

    await store.loadCategories();

    expect(store.error()).toBe('Failed load');
    expect(store.loading()).toBe(false);
  });

  it('creates a new category', async () => {
    const payload: CreateCategoryPayload = {
      name: 'Books',
      description: 'Printed books',
    };
    
    // Initial load
    getCategoriesUseCase.execute.mockResolvedValueOnce([CATEGORY_A]);
    await store.loadCategories();
    
    createCategoryUseCase.execute.mockResolvedValueOnce(CATEGORY_B);
    
    store.openCreateDialog();
    await store.saveCategory(payload.name, payload.description);

    expect(createCategoryUseCase.execute).toHaveBeenCalledWith(payload);
    expect(store.categories()).toEqual([CATEGORY_A, CATEGORY_B]);
    expect(store.dialogVisible()).toBe(false);
  });

  it('updates an existing category', async () => {
    const updated: Category = { ...CATEGORY_A, name: 'Electro' };
    const payload: UpdateCategoryPayload = { name: 'Electro', description: 'Electronic devices' };
    
    getCategoriesUseCase.execute.mockResolvedValueOnce([CATEGORY_A]);
    await store.loadCategories();
    
    getCategoryByIdUseCase.execute.mockResolvedValueOnce(CATEGORY_A);
    updateCategoryUseCase.execute.mockResolvedValueOnce(updated);
    
    await store.openEditDialog(CATEGORY_A);
    await store.saveCategory(payload.name!, payload.description || '');

    expect(updateCategoryUseCase.execute).toHaveBeenCalledWith(CATEGORY_A.categoryId, payload);
    expect(store.categories()).toEqual([updated]);
    expect(store.dialogVisible()).toBe(false);
  });

  it('deletes a category', async () => {
    getCategoriesUseCase.execute.mockResolvedValueOnce([CATEGORY_A]);
    await store.loadCategories();
    
    deleteCategoryUseCase.execute.mockResolvedValueOnce();
    
    store.requestDelete(CATEGORY_A);
    await store.confirmDelete();

    expect(deleteCategoryUseCase.execute).toHaveBeenCalledWith(CATEGORY_A.categoryId);
    expect(store.categories()).toEqual([]);
    expect(store.confirmDialogVisible()).toBe(false);
    expect(store.categoryToDelete()).toBeNull();
  });

  it('filters categories by search query', () => {
    store.categories.set([CATEGORY_A, CATEGORY_B]);
    
    store.onSearch('book');

    expect(store.searchQuery()).toBe('book');
    expect(store.filteredCategories()).toEqual([CATEGORY_B]);
  });
});

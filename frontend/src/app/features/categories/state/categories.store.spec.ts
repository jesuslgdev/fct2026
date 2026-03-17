import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CategoriesStore } from './categories.store';
import { AuthService } from '@core/services/auth.service';
import { CategoryRepository } from '@domain/repositories/category.repository';
import { GetCategoriesUseCase } from '@domain/usecases/category/get-categories.usecase';
import { GetCategoryByIdUseCase } from '@domain/usecases/category/get-category-by-id.usecase';
import { GetCategoryByNameUseCase } from '@domain/usecases/category/get-category-by-name.usecase';
import { CreateCategoryUseCase } from '@domain/usecases/category/create-category.usecase';
import { UpdateCategoryUseCase } from '@domain/usecases/category/update-category.usecase';
import { DeleteCategoryUseCase } from '@domain/usecases/category/delete-category.usecase';
import {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '@domain/models/category.model';
import {
  CategoryForbiddenError,
  CategoryValidationError,
  CategoryUnauthorizedError,
  CategoryNotFoundError,
  CategoryApiError,
  CategoryAlreadyExistsError,
  CategoryHasProductsError,
} from '@domain/models/category-errors';

const CATEGORY_A: Category = {
  categoryId: 1,
  name: 'Electronics',
  description: 'Electronic devices and accessories',
};

const CATEGORY_B: Category = {
  categoryId: 2,
  name: 'Clothing',
  description: 'Apparel and fashion items',
};

class MockAuthService {
  readonly user = signal({
    uid: 'uid-1',
    email: 'admin@example.com',
    displayName: 'Admin',
    photoURL: null,
    role: 'Administrator',
  });
}

class MockCategoryRepository {
  categoryHasProducts = vi.fn<(id: number) => Promise<boolean>>();
}

class MockGetCategoriesUseCase {
  execute = vi.fn<() => Promise<Category[]>>();
}

class MockGetCategoryByIdUseCase {
  execute = vi.fn<(id: number) => Promise<Category>>();
}

class MockGetCategoryByNameUseCase {
  execute = vi.fn<(name: string) => Promise<Category | null>>();
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
  let getCategoryByNameUseCase: MockGetCategoryByNameUseCase;
  let createCategoryUseCase: MockCreateCategoryUseCase;
  let updateCategoryUseCase: MockUpdateCategoryUseCase;
  let deleteCategoryUseCase: MockDeleteCategoryUseCase;
  let categoryRepository: MockCategoryRepository;

  beforeEach(() => {
    getCategoriesUseCase = new MockGetCategoriesUseCase();
    getCategoryByIdUseCase = new MockGetCategoryByIdUseCase();
    getCategoryByNameUseCase = new MockGetCategoryByNameUseCase();
    createCategoryUseCase = new MockCreateCategoryUseCase();
    updateCategoryUseCase = new MockUpdateCategoryUseCase();
    deleteCategoryUseCase = new MockDeleteCategoryUseCase();
    categoryRepository = new MockCategoryRepository();

    TestBed.configureTestingModule({
      providers: [
        CategoriesStore,
        { provide: AuthService, useValue: new MockAuthService() },
        { provide: CategoryRepository, useValue: categoryRepository },
        { provide: GetCategoriesUseCase, useValue: getCategoriesUseCase },
        { provide: GetCategoryByIdUseCase, useValue: getCategoryByIdUseCase },
        { provide: GetCategoryByNameUseCase, useValue: getCategoryByNameUseCase },
        { provide: CreateCategoryUseCase, useValue: createCategoryUseCase },
        { provide: UpdateCategoryUseCase, useValue: updateCategoryUseCase },
        { provide: DeleteCategoryUseCase, useValue: deleteCategoryUseCase },
      ],
    });

    store = TestBed.inject(CategoriesStore);
  });

  it('loads categories successfully', async () => {
    const categories = [CATEGORY_A, CATEGORY_B];
    getCategoriesUseCase.execute.mockResolvedValue(categories);

    await store.loadCategories();

    expect(getCategoriesUseCase.execute).toHaveBeenCalledOnce();
    expect(store.categories()).toEqual(categories);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('sets error when loading categories fails', async () => {
    getCategoriesUseCase.execute.mockRejectedValueOnce(new Error('boom'));

    await store.loadCategories();

    expect(store.error()).toBe('Failed to load categories.');
    expect(store.loading()).toBe(false);
  });

  it('maps forbidden categories error to specific message', async () => {
    getCategoriesUseCase.execute.mockRejectedValueOnce(new CategoryForbiddenError());

    await store.loadCategories();

    expect(store.error()).toBe('You do not have permissions to perform this action.');
  });

  it('maps validation categories error to backend message', async () => {
    createCategoryUseCase.execute.mockRejectedValueOnce(
      new CategoryValidationError({ field: 'name' }, 'Name already exists.'),
    );

    await store.saveCategory('Electronics', 'Test description');

    expect(store.error()).toBe('Name already exists.');
  });

  it('creates a new category and updates state', async () => {
    const payload: CreateCategoryPayload = {
      name: 'Clothing',
      description: 'Apparel and fashion items',
    };
    createCategoryUseCase.execute.mockResolvedValueOnce(CATEGORY_B);

    store.categories.set([CATEGORY_A]);
    store.dialogVisible.set(true);

    await store.saveCategory('Clothing', 'Apparel and fashion items');

    expect(createCategoryUseCase.execute).toHaveBeenCalledWith(payload);
    expect(store.categories()).toEqual([CATEGORY_A, CATEGORY_B]);
    expect(store.dialogVisible()).toBe(false);
    expect(store.selectedCategory()).toBeNull();
  });

  it('updates an existing category in edit mode', async () => {
    const updated: Category = { ...CATEGORY_A, name: 'Updated Electronics' };
    const payload: UpdateCategoryPayload = { name: 'Updated Electronics', description: 'Updated description' };
    updateCategoryUseCase.execute.mockResolvedValueOnce(updated);

    store.categories.set([CATEGORY_A]);
    store.selectedCategory.set(CATEGORY_A);
    store.dialogMode.set('edit');

    await store.saveCategory('Updated Electronics', 'Updated description');

    expect(updateCategoryUseCase.execute).toHaveBeenCalledWith(CATEGORY_A.categoryId, payload);
    expect(store.categories()).toEqual([updated]);
    expect(store.dialogVisible()).toBe(false);
  });

  it('deletes category and closes confirm dialog', async () => {
    deleteCategoryUseCase.execute.mockResolvedValueOnce();

    store.categories.set([CATEGORY_A, CATEGORY_B]);
    store.categoryToDelete.set(CATEGORY_A);
    store.confirmDialogVisible.set(true);

    await store.confirmDelete();

    expect(deleteCategoryUseCase.execute).toHaveBeenCalledWith(CATEGORY_A.categoryId);
    expect(store.categories()).toEqual([CATEGORY_B]);
    expect(store.confirmDialogVisible()).toBe(false);
    expect(store.categoryToDelete()).toBeNull();
  });

  it('loads category by ID successfully', async () => {
    getCategoryByIdUseCase.execute.mockResolvedValueOnce(CATEGORY_A);

    await store.loadCategoryById(1);

    expect(getCategoryByIdUseCase.execute).toHaveBeenCalledWith(1);
    expect(store.selectedCategory()).toEqual(CATEGORY_A);
    expect(store.loading()).toBe(false);
  });

  it('sets error when loading category by ID fails', async () => {
    getCategoryByIdUseCase.execute.mockRejectedValueOnce(new Error('not found'));

    await store.loadCategoryById(1);

    expect(store.error()).toBe('Failed to load category.');
    expect(store.loading()).toBe(false);
  });

  it('search filters categories correctly', () => {
    store.categories.set([CATEGORY_A, CATEGORY_B]);

    store.onSearch('electronic');

    expect(store.searchQuery()).toBe('electronic');
    expect(store.filteredCategories()).toEqual([CATEGORY_A]);
  });

  it('open create dialog sets correct state', () => {
    store.selectedCategory.set(CATEGORY_A);
    store.dialogMode.set('edit');

    store.openCreateDialog();

    expect(store.selectedCategory()).toBeNull();
    expect(store.dialogMode()).toBe('create');
    expect(store.dialogVisible()).toBe(true);
  });

  it('open edit dialog sets correct state', async () => {
    getCategoryByIdUseCase.execute.mockResolvedValue(CATEGORY_A);
    
    await store.openEditDialog(CATEGORY_A);

    expect(store.selectedCategory()).toEqual(CATEGORY_A);
    expect(store.dialogMode()).toBe('edit');
    expect(store.dialogVisible()).toBe(true);
  });

  it('close dialog resets state', () => {
    store.selectedCategory.set(CATEGORY_A);
    store.dialogVisible.set(true);

    store.closeDialog();

    expect(store.dialogVisible()).toBe(false);
    expect(store.selectedCategory()).toBeNull();
  });

  it('request delete sets confirm dialog', () => {
    store.requestDelete(CATEGORY_A);

    expect(store.categoryToDelete()).toEqual(CATEGORY_A);
    expect(store.confirmDialogVisible()).toBe(true);
  });

  it('cancel delete resets confirm dialog', () => {
    store.categoryToDelete.set(CATEGORY_A);
    store.confirmDialogVisible.set(true);

    store.cancelDelete();

    expect(store.confirmDialogVisible()).toBe(false);
    expect(store.categoryToDelete()).toBeNull();
  });

  it('canEdit returns true for Administrator', () => {
    expect(store.canEdit()).toBe(true);
  });

  it('filtered categories returns all when no search query', () => {
    store.categories.set([CATEGORY_A, CATEGORY_B]);
    store.searchQuery.set('');

    expect(store.filteredCategories()).toEqual([CATEGORY_A, CATEGORY_B]);
  });

  it('filtered categories filters by name and description', () => {
    store.categories.set([CATEGORY_A, CATEGORY_B]);
    store.searchQuery.set('clothing');

    expect(store.filteredCategories()).toEqual([CATEGORY_B]);
  });

  it('maps unauthorized error to session expired message', async () => {
    getCategoriesUseCase.execute.mockRejectedValueOnce(new CategoryUnauthorizedError());

    await store.loadCategories();

    expect(store.error()).toBe('Your session has expired. Please sign in again.');
  });

  it('maps not found error to specific message', async () => {
    getCategoryByIdUseCase.execute.mockRejectedValueOnce(new CategoryNotFoundError());

    await store.loadCategoryById(1);

    expect(store.error()).toBe('The selected category no longer exists.');
  });

  it('maps already exists error to specific message', async () => {
    createCategoryUseCase.execute.mockRejectedValueOnce(
      new CategoryAlreadyExistsError('Category already exists'),
    );

    await store.saveCategory('Electronics', 'Test');

    expect(store.error()).toBe('Category already exists');
  });

  it('maps has products error to specific message', async () => {
    deleteCategoryUseCase.execute.mockRejectedValueOnce(
      new CategoryHasProductsError('Cannot delete category with products'),
    );

    store.categoryToDelete.set(CATEGORY_A);
    store.confirmDialogVisible.set(true);

    await store.confirmDelete();

    expect(store.error()).toBe('Cannot delete category with products');
  });

  it('maps API error to fallback message', async () => {
    getCategoriesUseCase.execute.mockRejectedValueOnce(new CategoryApiError('Service unavailable'));

    await store.loadCategories();

    expect(store.error()).toBe('Service unavailable');
  });

  it('checkCategoryHasProducts returns repository result', async () => {
    categoryRepository.categoryHasProducts.mockResolvedValueOnce(true);

    const result = await store.checkCategoryHasProducts(1);

    expect(categoryRepository.categoryHasProducts).toHaveBeenCalledWith(1);
    expect(result).toBe(true);
  });

  it('checkCategoryHasProducts returns false on error', async () => {
    categoryRepository.categoryHasProducts.mockRejectedValueOnce(new Error('Error'));

    const result = await store.checkCategoryHasProducts(1);

    expect(result).toBe(false);
  });
});

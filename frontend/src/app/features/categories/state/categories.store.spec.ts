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
import { UserPermission } from '@domain/enums/user-permission.enum';
import {
  CategoryForbiddenError,
  CategoryValidationError,
  CategoryUnauthorizedError,
  CategoryNotFoundError,
  CategoryApiError,
  CategoryAlreadyExistsError,
  CategoryHasProductsError,
} from '@domain/models/category-errors';
import { Observable, of, throwError } from 'rxjs';

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
    role: UserRole.Administrator,
    permissions: [UserPermission.Admin],
  });
  readonly permissions = signal([UserPermission.Admin]);
  hasPermission(permission: UserPermission | readonly UserPermission[]): boolean {
    const p = Array.isArray(permission) ? permission : [permission];
    return p.some((perm) => (this.permissions() as UserPermission[]).includes(perm));
  }
}

class MockGetCategoriesUseCase {
  execute = vi.fn<() => Observable<Category[]>>();
}

class MockGetCategoryByIdUseCase {
  execute = vi.fn<(id: number) => Observable<Category>>();
}

class MockCreateCategoryUseCase {
  execute = vi.fn<(payload: CreateCategoryPayload) => Observable<Category>>();
}

class MockUpdateCategoryUseCase {
  execute = vi.fn<(id: number, payload: UpdateCategoryPayload) => Observable<Category>>();
}

class MockDeleteCategoryUseCase {
  execute = vi.fn<(id: number) => Observable<void>>();
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
    const categories = [CATEGORY_A, CATEGORY_B];
    getCategoriesUseCase.execute.mockReturnValue(of(categories));

    await store.loadCategories();

    expect(getCategoriesUseCase.execute).toHaveBeenCalled();
    expect(store.categories()).toEqual(categories);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('sets error when loading categories fails', async () => {
    getCategoriesUseCase.execute.mockReturnValueOnce(throwError(() => new Error()));

    await store.loadCategories();

    expect(store.error()).toBe('No se pudieron cargar las categorías.');
    expect(store.loading()).toBe(false);
  });

  it('maps forbidden categories error to specific message', async () => {
    getCategoriesUseCase.execute.mockReturnValueOnce(throwError(() => new CategoryForbiddenError()));

    await store.loadCategories();

    expect(store.error()).toBe('Se requieren permisos de administrador.');
  });

  it('maps validation categories error to backend message', async () => {
    createCategoryUseCase.execute.mockReturnValueOnce(
      throwError(() => new CategoryValidationError({ field: 'name' }, 'Name already exists.')),
    );

    await store.saveCategory('Electronics', 'Test description');

    expect(store.error()).toBe('Name already exists.');
  });

  it('creates a new category and updates state', async () => {
    const payload: CreateCategoryPayload = {
      name: 'Clothing',
      description: 'Apparel and fashion items',
    };
    getCategoriesUseCase.execute.mockReturnValueOnce(of([CATEGORY_A]));
    await store.loadCategories();

    createCategoryUseCase.execute.mockReturnValueOnce(of(CATEGORY_B));
    store.openCreateDialog();
    await store.saveCategory('Clothing', 'Apparel and fashion items');

    expect(createCategoryUseCase.execute).toHaveBeenCalledWith(payload);
    expect(store.categories()).toEqual([CATEGORY_A, CATEGORY_B]);
    expect(store.dialogVisible()).toBe(false);
    expect(store.selectedCategory()).toBeNull();
  });

  it('updates an existing category in edit mode', async () => {
    const updated: Category = { ...CATEGORY_A, name: 'Updated Electronics' };
    const payload: UpdateCategoryPayload = { name: 'Updated Electronics', description: 'Updated description' };

    getCategoriesUseCase.execute.mockReturnValueOnce(of([CATEGORY_A]));
    await store.loadCategories();

    getCategoryByIdUseCase.execute.mockReturnValue(of(CATEGORY_A));
    await store.openEditDialog(CATEGORY_A);

    updateCategoryUseCase.execute.mockReturnValueOnce(of(updated));
    await store.saveCategory('Updated Electronics', 'Updated description');

    expect(updateCategoryUseCase.execute).toHaveBeenCalledWith(CATEGORY_A.categoryId, payload);
    expect(store.categories()).toEqual([updated]);
    expect(store.dialogVisible()).toBe(false);
  });

  it('deletes category and closes confirm dialog', async () => {
    getCategoriesUseCase.execute.mockReturnValueOnce(of([CATEGORY_A, CATEGORY_B]));
    await store.loadCategories();

    deleteCategoryUseCase.execute.mockReturnValueOnce(of(undefined));
    store.requestDelete(CATEGORY_A);
    await store.confirmDelete();

    expect(deleteCategoryUseCase.execute).toHaveBeenCalledWith(CATEGORY_A.categoryId);
    expect(store.categories()).toEqual([CATEGORY_B]);
    expect(store.confirmDialogVisible()).toBe(false);
    expect(store.categoryToDelete()).toBeNull();
  });

  it('loads category by ID successfully', async () => {
    getCategoryByIdUseCase.execute.mockReturnValueOnce(of(CATEGORY_A));

    await store.loadCategoryById(1);

    expect(getCategoryByIdUseCase.execute).toHaveBeenCalledWith(1);
    expect(store.selectedCategory()).toEqual(CATEGORY_A);
    expect(store.loading()).toBe(false);
  });

  it('sets error when loading category by ID fails', async () => {
    getCategoryByIdUseCase.execute.mockReturnValueOnce(throwError(() => new Error()));

    await store.loadCategoryById(1);

    expect(store.error()).toBe('No se pudo cargar la categoría.');
    expect(store.loading()).toBe(false);
  });

  it('search filters categories correctly', async () => {
    getCategoriesUseCase.execute.mockReturnValueOnce(of([CATEGORY_A, CATEGORY_B]));
    await store.loadCategories();

    store.onSearch('electronic');

    expect(store.searchQuery()).toBe('electronic');
    expect(store.filteredCategories()).toEqual([CATEGORY_A]);
  });

  it('open create dialog sets correct state', async () => {
    getCategoryByIdUseCase.execute.mockReturnValue(of(CATEGORY_A));
    await store.openEditDialog(CATEGORY_A);

    store.openCreateDialog();

    expect(store.selectedCategory()).toBeNull();
    expect(store.dialogMode()).toBe('create');
    expect(store.dialogVisible()).toBe(true);
  });

  it('open edit dialog sets correct state', async () => {
    getCategoryByIdUseCase.execute.mockReturnValue(of(CATEGORY_A));

    await store.openEditDialog(CATEGORY_A);

    expect(store.selectedCategory()).toEqual(CATEGORY_A);
    expect(store.dialogMode()).toBe('edit');
    expect(store.dialogVisible()).toBe(true);
  });

  it('close dialog resets state', async () => {
    getCategoryByIdUseCase.execute.mockReturnValue(of(CATEGORY_A));
    await store.openEditDialog(CATEGORY_A);

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
    store.requestDelete(CATEGORY_A);
    store.cancelDelete();

    expect(store.confirmDialogVisible()).toBe(false);
    expect(store.categoryToDelete()).toBeNull();
  });

  it('canEdit returns true for Administrator', () => {
    store.canEdit();
    expect(store.canEdit()).toBe(true);
  });

  it('canEdit returns true for Purchases Manager', () => {
    const authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    authService.permissions.set([UserPermission.PurchasesManager]);
    expect(store.canEdit()).toBe(true);
  });

  it('canEdit returns false for Sales Manager', () => {
    const authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    authService.permissions.set([UserPermission.SalesManager]);
    expect(store.canEdit()).toBe(false);
  });

  it('filtered categories returns all when no search query', async () => {
    getCategoriesUseCase.execute.mockReturnValueOnce(of([CATEGORY_A, CATEGORY_B]));
    await store.loadCategories();

    expect(store.filteredCategories()).toEqual([CATEGORY_A, CATEGORY_B]);
  });

  it('filtered categories filters by name and description', async () => {
    getCategoriesUseCase.execute.mockReturnValueOnce(of([CATEGORY_A, CATEGORY_B]));
    await store.loadCategories();

    store.onSearch('clothing');

    expect(store.filteredCategories()).toEqual([CATEGORY_B]);
  });

  it('maps unauthorized error to session expired message', async () => {
    getCategoriesUseCase.execute.mockReturnValueOnce(throwError(() => new CategoryUnauthorizedError()));

    await store.loadCategories();

    expect(store.error()).toBe('Autenticación requerida.');
  });

  it('maps not found error to specific message', async () => {
    getCategoryByIdUseCase.execute.mockReturnValueOnce(throwError(() => new CategoryNotFoundError()));

    await store.loadCategoryById(1);

    expect(store.error()).toBe('Categoría no encontrada.');
  });

  it('maps already exists error to specific message', async () => {
    createCategoryUseCase.execute.mockReturnValueOnce(
      throwError(() => new CategoryAlreadyExistsError('Category already exists')),
    );

    await store.saveCategory('Electronics', 'Test');

    expect(store.error()).toBe('Category already exists');
  });

  it('maps has products error to specific message', async () => {
    deleteCategoryUseCase.execute.mockReturnValueOnce(
      throwError(() => new CategoryHasProductsError('Cannot delete category with products')),
    );

    store.requestDelete(CATEGORY_A);
    await store.confirmDelete();

    expect(store.error()).toBe('Cannot delete category with products');
  });

  it('maps API error to fallback message', async () => {
    getCategoriesUseCase.execute.mockReturnValueOnce(throwError(() => new CategoryApiError('Service unavailable')));

    await store.loadCategories();

    expect(store.error()).toBe('Service unavailable');
  });
});

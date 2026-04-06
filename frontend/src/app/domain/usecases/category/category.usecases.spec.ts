import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CategoryRepository } from '@domain/repositories/category.repository';
import {
  Category,
  CreateCategoryPayload,
  CategoryListResult,
  UpdateCategoryPayload,
} from '@domain/models/category.model';
import { GetCategoriesUseCase } from './get-categories.usecase';
import { GetCategoryByIdUseCase } from './get-category-by-id.usecase';
import { GetCategoryByNameUseCase } from './get-category-by-name.usecase';
import { CreateCategoryUseCase } from './create-category.usecase';
import { UpdateCategoryUseCase } from './update-category.usecase';
import { DeleteCategoryUseCase } from './delete-category.usecase';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';

const CATEGORY_MOCK: Category = {
  categoryId: 1,
  name: 'Electronics',
  description: 'Electronic devices and accessories',
};

class MockCategoryRepository implements CategoryRepository {
  getCategories = vi.fn<() => Observable<CategoryListResult>>();
  getCategoryById = vi.fn<(id: number) => Observable<Category>>();
  getCategoryByName = vi.fn<(name: string) => Observable<Category | null>>();
  createCategory = vi.fn<(payload: CreateCategoryPayload) => Observable<Category>>();
  updateCategory = vi.fn<(categoryId: number, payload: UpdateCategoryPayload) => Observable<Category>>();
  deleteCategory = vi.fn<(id: number) => Observable<void>>();
  categoryHasProducts = vi.fn<(id: number) => Observable<boolean>>();
}

describe('Category Use Cases', () => {
  let repo: MockCategoryRepository;

  beforeEach(() => {
    repo = new MockCategoryRepository();
    TestBed.configureTestingModule({
      providers: [
        GetCategoriesUseCase,
        GetCategoryByIdUseCase,
        GetCategoryByNameUseCase,
        CreateCategoryUseCase,
        UpdateCategoryUseCase,
        DeleteCategoryUseCase,
        { provide: CategoryRepository, useValue: repo },
      ],
    });
  });

  describe('GetCategoriesUseCase', () => {
    it('should delegate to repository', async () => {
      const useCase = TestBed.inject(GetCategoriesUseCase);
      repo.getCategories.mockReturnValue(of([CATEGORY_MOCK]));

      const result = await firstValueFrom(useCase.execute());

      expect(repo.getCategories).toHaveBeenCalledOnce();
      expect(result).toEqual([CATEGORY_MOCK]);
    });
  });

  describe('GetCategoryByIdUseCase', () => {
    it('should delegate to repository', async () => {
      const useCase = TestBed.inject(GetCategoryByIdUseCase);
      repo.getCategoryById.mockReturnValue(of(CATEGORY_MOCK));

      const result = await firstValueFrom(useCase.execute(1));

      expect(repo.getCategoryById).toHaveBeenCalledWith(1);
      expect(result).toEqual(CATEGORY_MOCK);
    });
  });

  describe('GetCategoryByNameUseCase', () => {
    it('should return null for empty name', async () => {
      const useCase = TestBed.inject(GetCategoryByNameUseCase);

      const result = await firstValueFrom(useCase.execute(''));

      expect(result).toBeNull();
      expect(repo.getCategoryByName).not.toHaveBeenCalled();
    });

    it('should delegate to repository for valid name', async () => {
      const useCase = TestBed.inject(GetCategoryByNameUseCase);
      repo.getCategoryByName.mockReturnValue(of(CATEGORY_MOCK));

      const result = await firstValueFrom(useCase.execute('Electronics'));

      expect(repo.getCategoryByName).toHaveBeenCalledWith('Electronics');
      expect(result).toEqual(CATEGORY_MOCK);
    });
  });

  describe('CreateCategoryUseCase', () => {
    it('should delegate to repository', async () => {
      const useCase = TestBed.inject(CreateCategoryUseCase);
      const payload: CreateCategoryPayload = {
        name: 'New Category',
        description: 'Description',
      };
      repo.createCategory.mockReturnValue(of(CATEGORY_MOCK));

      const result = await firstValueFrom(useCase.execute(payload));

      expect(repo.createCategory).toHaveBeenCalledWith(payload);
      expect(result).toEqual(CATEGORY_MOCK);
    });

    it('should propagate repository errors', async () => {
      const useCase = TestBed.inject(CreateCategoryUseCase);
      const payload: CreateCategoryPayload = {
        name: 'New Category',
        description: 'Description',
      };
      repo.createCategory.mockReturnValue(throwError(() => new Error('Repository error')));

      await expect(firstValueFrom(useCase.execute(payload))).rejects.toThrow('Repository error');
      expect(repo.createCategory).toHaveBeenCalledWith(payload);
    });
  });

  describe('UpdateCategoryUseCase', () => {
    it('should delegate to repository', async () => {
      const useCase = TestBed.inject(UpdateCategoryUseCase);
      const payload: UpdateCategoryPayload = { name: 'Updated Category' };
      const updated: Category = { ...CATEGORY_MOCK, name: 'Updated Category' };
      repo.updateCategory.mockReturnValue(of(updated));

      const result = await firstValueFrom(useCase.execute(1, payload));

      expect(repo.updateCategory).toHaveBeenCalledWith(1, payload);
      expect(result).toEqual(updated);
    });

    it('should propagate repository errors', async () => {
      const useCase = TestBed.inject(UpdateCategoryUseCase);
      const payload: UpdateCategoryPayload = { name: 'Updated Category' };
      repo.updateCategory.mockReturnValue(throwError(() => new Error('Repository error')));

      await expect(firstValueFrom(useCase.execute(1, payload))).rejects.toThrow('Repository error');
      expect(repo.updateCategory).toHaveBeenCalledWith(1, payload);
    });
  });

  describe('DeleteCategoryUseCase', () => {
    it('should delegate to repository', async () => {
      const useCase = TestBed.inject(DeleteCategoryUseCase);
      repo.deleteCategory.mockReturnValue(of(undefined));

      await firstValueFrom(useCase.execute(1));

      expect(repo.deleteCategory).toHaveBeenCalledWith(1);
      expect(repo.deleteCategory).toHaveBeenCalledOnce();
    });

    it('should propagate repository errors', async () => {
      const useCase = TestBed.inject(DeleteCategoryUseCase);
      repo.deleteCategory.mockReturnValue(throwError(() => new Error('Repository error')));

      await expect(firstValueFrom(useCase.execute(1))).rejects.toThrow('Repository error');
      expect(repo.deleteCategory).toHaveBeenCalledWith(1);
    });
  });
});

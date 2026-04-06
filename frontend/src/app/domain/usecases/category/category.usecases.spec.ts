import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CategoryRepository } from '@domain/repositories/category.repository';
import {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '@domain/models/category.model';
import { GetCategoriesUseCase } from './get-categories.usecase';
import { GetCategoryByIdUseCase } from './get-category-by-id.usecase';
import { GetCategoryByNameUseCase } from './get-category-by-name.usecase';
import { CreateCategoryUseCase } from './create-category.usecase';
import { UpdateCategoryUseCase } from './update-category.usecase';
import { DeleteCategoryUseCase } from './delete-category.usecase';

const CATEGORY_MOCK: Category = {
  categoryId: 1,
  name: 'Electronics',
  description: 'Electronic devices and accessories',
};

class MockCategoryRepository implements CategoryRepository {
  getCategories = vi.fn<() => Promise<Category[]>>();
  getCategoryById = vi.fn<(id: number) => Promise<Category>>();
  getCategoryByName = vi.fn<(name: string) => Promise<Category | null>>();
  createCategory = vi.fn<(payload: CreateCategoryPayload) => Promise<Category>>();
  updateCategory = vi.fn<(categoryId: number, payload: UpdateCategoryPayload) => Promise<Category>>();
  deleteCategory = vi.fn<(id: number) => Promise<void>>();
  categoryHasProducts = vi.fn<(id: number) => Promise<boolean>>();
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
      repo.getCategories.mockResolvedValueOnce([CATEGORY_MOCK]);

      const result = await useCase.execute();

      expect(repo.getCategories).toHaveBeenCalledOnce();
      expect(result).toEqual([CATEGORY_MOCK]);
    });
  });

  describe('GetCategoryByIdUseCase', () => {
    it('should return category when found', async () => {
      const useCase = TestBed.inject(GetCategoryByIdUseCase);
      repo.getCategoryById.mockResolvedValueOnce(CATEGORY_MOCK);

      const result = await useCase.execute(1);

      expect(repo.getCategoryById).toHaveBeenCalledWith(1);
      expect(result).toEqual(CATEGORY_MOCK);
    });

    it('should throw CategoryNotFoundError when not found', async () => {
      const useCase = TestBed.inject(GetCategoryByIdUseCase);
      repo.getCategoryById.mockResolvedValueOnce(null as unknown as Category);

      await expect(useCase.execute(1)).rejects.toThrowError('Category not found.');
    });
  });

  describe('GetCategoryByNameUseCase', () => {
    it('should return null for empty name', async () => {
      const useCase = TestBed.inject(GetCategoryByNameUseCase);

      const result = await useCase.execute('');

      expect(result).toBeNull();
      expect(repo.getCategoryByName).not.toHaveBeenCalled();
    });

    it('should delegate to repository for valid name', async () => {
      const useCase = TestBed.inject(GetCategoryByNameUseCase);
      repo.getCategoryByName.mockResolvedValueOnce(CATEGORY_MOCK);

      const result = await useCase.execute('Electronics');

      expect(repo.getCategoryByName).toHaveBeenCalledWith('Electronics');
      expect(result).toEqual(CATEGORY_MOCK);
    });
  });

  describe('CreateCategoryUseCase', () => {
    it('should normalize and delegate to repository with valid payload', async () => {
      const useCase = TestBed.inject(CreateCategoryUseCase);
      const payload: CreateCategoryPayload = {
        name: '  New Category  ',
        description: '  Description  ',
      };
      const normalizedPayload: CreateCategoryPayload = {
        name: 'New Category',
        description: 'Description',
      };
      repo.createCategory.mockResolvedValueOnce(CATEGORY_MOCK);

      const result = await useCase.execute(payload);

      expect(repo.createCategory).toHaveBeenCalledWith(normalizedPayload);
      expect(result).toEqual(CATEGORY_MOCK);
    });

    it('should throw CategoryValidationError for empty name', async () => {
      const useCase = TestBed.inject(CreateCategoryUseCase);
      const payload: CreateCategoryPayload = { name: '   ', description: '' };

      await expect(useCase.execute(payload)).rejects.toThrowError('Category name is required.');
      expect(repo.createCategory).not.toHaveBeenCalled();
    });

    it('should throw CategoryValidationError for too long name', async () => {
      const useCase = TestBed.inject(CreateCategoryUseCase);
      const payload: CreateCategoryPayload = { name: 'a'.repeat(101), description: '' };

      await expect(useCase.execute(payload)).rejects.toThrowError(
        'Category name cannot exceed 100 characters.'
      );
    });

    it('should throw CategoryValidationError for too long description', async () => {
      const useCase = TestBed.inject(CreateCategoryUseCase);
      const payload: CreateCategoryPayload = { name: 'Valid Name', description: 'a'.repeat(501) };

      await expect(useCase.execute(payload)).rejects.toThrowError(
        'Description cannot exceed 500 characters.'
      );
    });
  });

  describe('UpdateCategoryUseCase', () => {
    it('should normalize and delegate to repository', async () => {
      const useCase = TestBed.inject(UpdateCategoryUseCase);
      const payload: UpdateCategoryPayload = { name: '  Updated Category  ' };
      const normalizedPayload: UpdateCategoryPayload = { name: 'Updated Category' };
      const updated: Category = { ...CATEGORY_MOCK, name: 'Updated Category' };
      repo.updateCategory.mockResolvedValueOnce(updated);

      const result = await useCase.execute(1, payload);

      expect(repo.updateCategory).toHaveBeenCalledWith(1, normalizedPayload);
      expect(result).toEqual(updated);
    });

    it('should throw CategoryValidationError for empty name if provided', async () => {
      const useCase = TestBed.inject(UpdateCategoryUseCase);
      const payload: UpdateCategoryPayload = { name: '   ' };

      await expect(useCase.execute(1, payload)).rejects.toThrowError(
        'Category name cannot be empty.'
      );
    });
  });

  describe('DeleteCategoryUseCase', () => {
    it('should delete when category has no products', async () => {
      const useCase = TestBed.inject(DeleteCategoryUseCase);
      repo.categoryHasProducts.mockResolvedValueOnce(false);
      repo.deleteCategory.mockResolvedValueOnce();

      await useCase.execute(1);

      expect(repo.categoryHasProducts).toHaveBeenCalledWith(1);
      expect(repo.deleteCategory).toHaveBeenCalledWith(1);
    });

    it('should throw CategoryHasProductsError when category has products', async () => {
      const useCase = TestBed.inject(DeleteCategoryUseCase);
      repo.categoryHasProducts.mockResolvedValueOnce(true);

      await expect(useCase.execute(1)).rejects.toThrowError(
        'Category has associated products.'
      );
      expect(repo.deleteCategory).not.toHaveBeenCalled();
    });
  });
});

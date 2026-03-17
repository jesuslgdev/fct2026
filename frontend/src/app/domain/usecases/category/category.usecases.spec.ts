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
import {
  CategoryNotFoundError,
  CategoryAlreadyExistsError,
  CategoryValidationError,
  CategoryHasProductsError,
} from '@domain/models/category-errors';

const CATEGORY_MOCK: Category = {
  categoryId: 1,
  name: 'Electronics',
  description: 'Electronic devices and accessories',
};

class MockCategoryRepository implements CategoryRepository {
  getCategories = vi.fn<() => Promise<Category[]>>();
  getCategoryById = vi.fn<(id: number) => Promise<Category>>();
  getCategoryByName = vi.fn<(name: string) => Promise<Category | null>>();
  createCategory = vi.fn<(name: string, description: string) => Promise<Category>>();
  updateCategory = vi.fn<(id: number, name: string | null, description: string | null) => Promise<Category>>();
  deleteCategory = vi.fn<(id: number) => Promise<void>>();
  categoryHasProducts = vi.fn<(id: number) => Promise<boolean>>();
}

describe('Category Use Cases', () => {
  let repo: MockCategoryRepository;
  let getCategoriesUseCase: GetCategoriesUseCase;
  let getCategoryByIdUseCase: GetCategoryByIdUseCase;
  let getCategoryByNameUseCase: GetCategoryByNameUseCase;
  let createCategoryUseCase: CreateCategoryUseCase;
  let updateCategoryUseCase: UpdateCategoryUseCase;
  let deleteCategoryUseCase: DeleteCategoryUseCase;

  beforeEach(() => {
    repo = new MockCategoryRepository();
    TestBed.configureTestingModule({
      providers: [
        { provide: CategoryRepository, useValue: repo },
        GetCategoriesUseCase,
        GetCategoryByIdUseCase,
        GetCategoryByNameUseCase,
        CreateCategoryUseCase,
        UpdateCategoryUseCase,
        DeleteCategoryUseCase,
      ],
    });
    getCategoriesUseCase = TestBed.inject(GetCategoriesUseCase);
    getCategoryByIdUseCase = TestBed.inject(GetCategoryByIdUseCase);
    getCategoryByNameUseCase = TestBed.inject(GetCategoryByNameUseCase);
    createCategoryUseCase = TestBed.inject(CreateCategoryUseCase);
    updateCategoryUseCase = TestBed.inject(UpdateCategoryUseCase);
    deleteCategoryUseCase = TestBed.inject(DeleteCategoryUseCase);
  });

  describe('GetCategoriesUseCase', () => {
    it('should return all categories', async () => {
      repo.getCategories.mockResolvedValue([CATEGORY_MOCK]);
      
      const result = await getCategoriesUseCase.execute();
      
      expect(result).toEqual([CATEGORY_MOCK]);
      expect(repo.getCategories).toHaveBeenCalledOnce();
    });

    it('should throw ApiError on repository failure', async () => {
      repo.getCategories.mockRejectedValue(new Error('Network error'));
      
      await expect(getCategoriesUseCase.execute()).rejects.toThrow('Failed to fetch categories.');
    });
  });

  describe('GetCategoryByIdUseCase', () => {
    it('should return category by valid ID', async () => {
      repo.getCategoryById.mockResolvedValue(CATEGORY_MOCK);
      
      const result = await getCategoryByIdUseCase.execute(1);
      
      expect(result).toEqual(CATEGORY_MOCK);
      expect(repo.getCategoryById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundError for invalid ID', async () => {
      await expect(getCategoryByIdUseCase.execute(0)).rejects.toThrow(CategoryNotFoundError);
      await expect(getCategoryByIdUseCase.execute(-1)).rejects.toThrow(CategoryNotFoundError);
    });

    it('should propagate NotFoundError from repository', async () => {
      repo.getCategoryById.mockRejectedValue(new CategoryNotFoundError());
      
      await expect(getCategoryByIdUseCase.execute(999)).rejects.toThrow(CategoryNotFoundError);
    });
  });

  describe('GetCategoryByNameUseCase', () => {
    it('should return category by valid name', async () => {
      repo.getCategoryByName.mockResolvedValue(CATEGORY_MOCK);
      
      const result = await getCategoryByNameUseCase.execute('Electronics');
      
      expect(result).toEqual(CATEGORY_MOCK);
      expect(repo.getCategoryByName).toHaveBeenCalledWith('Electronics');
    });

    it('should return null for empty name', async () => {
      const result = await getCategoryByNameUseCase.execute('');
      
      expect(result).toBeNull();
      expect(repo.getCategoryByName).not.toHaveBeenCalled();
    });

    it('should trim whitespace from name', async () => {
      repo.getCategoryByName.mockResolvedValue(CATEGORY_MOCK);
      
      await getCategoryByNameUseCase.execute('  Electronics  ');
      
      expect(repo.getCategoryByName).toHaveBeenCalledWith('Electronics');
    });
  });

  describe('CreateCategoryUseCase', () => {
    it('should create category with valid data', async () => {
      repo.createCategory.mockResolvedValue(CATEGORY_MOCK);
      
      const payload: CreateCategoryPayload = { name: 'Electronics', description: 'Devices' };
      const result = await createCategoryUseCase.execute(payload);
      
      expect(result).toEqual(CATEGORY_MOCK);
      expect(repo.createCategory).toHaveBeenCalledWith('Electronics', 'Devices');
    });

    it('should throw ValidationError for empty name', async () => {
      const payload: CreateCategoryPayload = { name: '', description: 'Test' };
      
      await expect(createCategoryUseCase.execute(payload)).rejects.toThrow(CategoryValidationError);
    });

    it('should throw ValidationError for name too long', async () => {
      const payload: CreateCategoryPayload = { name: 'a'.repeat(101), description: 'Test' };
      
      await expect(createCategoryUseCase.execute(payload)).rejects.toThrow(CategoryValidationError);
    });

    it('should throw ValidationError for description too long', async () => {
      const payload: CreateCategoryPayload = { name: 'Valid', description: 'a'.repeat(501) };
      
      await expect(createCategoryUseCase.execute(payload)).rejects.toThrow(CategoryValidationError);
    });

    it('should throw AlreadyExistsError on duplicate name', async () => {
      repo.createCategory.mockRejectedValue(new Error('Duplicate'));
      
      const payload: CreateCategoryPayload = { name: 'Electronics', description: 'Test' };
      
      await expect(createCategoryUseCase.execute(payload)).rejects.toThrow(CategoryAlreadyExistsError);
    });

    it('should trim whitespace from name', async () => {
      repo.createCategory.mockResolvedValue(CATEGORY_MOCK);
      
      const payload: CreateCategoryPayload = { name: '  Electronics  ', description: 'Test' };
      
      await createCategoryUseCase.execute(payload);
      
      expect(repo.createCategory).toHaveBeenCalledWith('Electronics', 'Test');
    });
  });

  describe('UpdateCategoryUseCase', () => {
    it('should update category with valid data', async () => {
      repo.updateCategory.mockResolvedValue(CATEGORY_MOCK);
      
      const payload: UpdateCategoryPayload = { name: 'Updated', description: 'Updated desc' };
      const result = await updateCategoryUseCase.execute(1, payload);
      
      expect(result).toEqual(CATEGORY_MOCK);
      expect(repo.updateCategory).toHaveBeenCalledWith(1, 'Updated', 'Updated desc');
    });

    it('should throw ValidationError for invalid ID', async () => {
      const payload: UpdateCategoryPayload = { name: 'Test' };
      
      await expect(updateCategoryUseCase.execute(0, payload)).rejects.toThrow(CategoryNotFoundError);
    });

    it('should throw ValidationError when no fields provided', async () => {
      const payload: UpdateCategoryPayload = { name: null, description: null };
      
      await expect(updateCategoryUseCase.execute(1, payload)).rejects.toThrow(CategoryValidationError);
    });

    it('should throw ValidationError for invalid name', async () => {
      const payload: UpdateCategoryPayload = { name: '' };
      
      await expect(updateCategoryUseCase.execute(1, payload)).rejects.toThrow(CategoryValidationError);
    });

    it('should throw ValidationError for description too long', async () => {
      const payload: UpdateCategoryPayload = { description: 'a'.repeat(501) };
      
      await expect(updateCategoryUseCase.execute(1, payload)).rejects.toThrow(CategoryValidationError);
    });

    it('should handle partial update with only name', async () => {
      repo.updateCategory.mockResolvedValue(CATEGORY_MOCK);
      
      const payload: UpdateCategoryPayload = { name: 'New name' };
      
      await updateCategoryUseCase.execute(1, payload);
      
      expect(repo.updateCategory).toHaveBeenCalledWith(1, 'New name', null);
    });

    it('should handle partial update with only description', async () => {
      repo.updateCategory.mockResolvedValue(CATEGORY_MOCK);
      
      const payload: UpdateCategoryPayload = { description: 'New description' };
      
      await updateCategoryUseCase.execute(1, payload);
      
      expect(repo.updateCategory).toHaveBeenCalledWith(1, null, 'New description');
    });
  });

  describe('DeleteCategoryUseCase', () => {
    it('should delete category without products', async () => {
      repo.categoryHasProducts.mockResolvedValue(false);
      repo.deleteCategory.mockResolvedValue();
      
      await deleteCategoryUseCase.execute(1);
      
      expect(repo.categoryHasProducts).toHaveBeenCalledWith(1);
      expect(repo.deleteCategory).toHaveBeenCalledWith(1);
    });

    it('should throw ValidationError for invalid ID', async () => {
      await expect(deleteCategoryUseCase.execute(0)).rejects.toThrow(CategoryNotFoundError);
    });

    it('should throw HasProductsError when category has products', async () => {
      repo.categoryHasProducts.mockResolvedValue(true);
      
      await expect(deleteCategoryUseCase.execute(1)).rejects.toThrow(CategoryHasProductsError);
    });

    it('should propagate NotFoundError from repository', async () => {
      repo.categoryHasProducts.mockResolvedValue(false);
      repo.deleteCategory.mockRejectedValue(new CategoryNotFoundError());
      
      await expect(deleteCategoryUseCase.execute(999)).rejects.toThrow(CategoryNotFoundError);
    });
  });
});

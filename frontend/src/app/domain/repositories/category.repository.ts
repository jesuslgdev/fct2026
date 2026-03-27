import {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CategoryListResult,
} from '@domain/models/category.model';

export abstract class CategoryRepository {
  abstract getCategories(): Promise<CategoryListResult>;
  abstract getCategoryById(categoryId: number): Promise<Category>;
  abstract getCategoryByName(name: string): Promise<Category | null>;
  abstract createCategory(payload: CreateCategoryPayload): Promise<Category>;
  abstract updateCategory(categoryId: number, payload: UpdateCategoryPayload): Promise<Category>;
  abstract deleteCategory(categoryId: number): Promise<void>;
}

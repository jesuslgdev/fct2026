import {
  Category,
  CategoryListResult,
} from '@domain/models/category.model';

export abstract class CategoryRepository {
  abstract getCategories(): Promise<CategoryListResult>;
  abstract getCategoryById(categoryId: number): Promise<Category>;
  abstract getCategoryByName(name: string): Promise<Category | null>;
  abstract createCategory(name: string, description: string): Promise<Category>;
  abstract updateCategory(
    categoryId: number, 
    name: string | null, 
    description: string | null
  ): Promise<Category>;
  abstract deleteCategory(categoryId: number): Promise<void>;
  abstract categoryHasProducts(categoryId: number): Promise<boolean>;
}

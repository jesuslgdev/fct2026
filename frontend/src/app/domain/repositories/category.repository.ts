import { Observable } from 'rxjs';
import {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CategoryListResult,
} from '@domain/models/category.model';

export abstract class CategoryRepository {
  abstract getCategories(): Observable<CategoryListResult>;
  abstract getCategoryById(categoryId: number): Observable<Category>;
  abstract getCategoryByName(name: string): Observable<Category | null>;
  abstract createCategory(payload: CreateCategoryPayload): Observable<Category>;
  abstract updateCategory(categoryId: number, payload: UpdateCategoryPayload): Observable<Category>;
  abstract deleteCategory(categoryId: number): Observable<void>;
}

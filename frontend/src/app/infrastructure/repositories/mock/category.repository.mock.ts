import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { CategoryRepository } from '@domain/repositories/category.repository';
import {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CategoryListResult,
} from '@domain/models/category.model';
import {
  CategoryAlreadyExistsError,
  CategoryHasProductsError,
  CategoryNotFoundError,
} from '@domain/models/category-errors';

const INITIAL_MOCK_CATEGORIES: Category[] = [
  {
    categoryId: 1,
    name: 'Electronics',
    description: 'Electronic devices and accessories',
  },
  {
    categoryId: 2,
    name: 'Clothing',
    description: 'Apparel and fashion items',
  },
  {
    categoryId: 3,
    name: 'Books',
    description: 'Books and educational materials',
  },
  {
    categoryId: 4,
    name: 'Home & Garden',
    description: 'Home improvement and garden supplies',
  },
  {
    categoryId: 5,
    name: 'Sports',
    description: 'Sports equipment and accessories',
  },
];

@Injectable()
export class MockCategoryRepository implements CategoryRepository {
  private categories: Category[];

  constructor() {
    this.categories = INITIAL_MOCK_CATEGORIES.map((c) => ({ ...c }));
  }

  getCategories(): Observable<CategoryListResult> {
    return of([...this.categories]);
  }

  getCategoryById(categoryId: number): Observable<Category> {
    const category = this.categories.find((c) => c.categoryId === categoryId);
    if (!category) {
      return throwError(() => new CategoryNotFoundError());
    }
    return of({ ...category });
  }

  getCategoryByName(name: string): Observable<Category | null> {
    const category = this.categories.find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );
    return of(category ? { ...category } : null);
  }

  createCategory(payload: CreateCategoryPayload): Observable<Category> {
    // Check if category with same name already exists
    const existing = this.categories.find(
      (c) => c.name.toLowerCase() === payload.name.toLowerCase()
    );
    if (existing) {
      return throwError(() => new CategoryAlreadyExistsError());
    }

    const nextId = Math.max(0, ...this.categories.map((c) => c.categoryId)) + 1;
    const newCategory: Category = {
      categoryId: nextId,
      name: payload.name.trim(),
      description: payload.description?.trim() ?? '',
    };
    this.categories = [...this.categories, newCategory];
    return of({ ...newCategory });
  }

  updateCategory(
    categoryId: number,
    payload: UpdateCategoryPayload
  ): Observable<Category> {
    const index = this.categories.findIndex((c) => c.categoryId === categoryId);
    if (index === -1) {
      return throwError(() => new CategoryNotFoundError());
    }

    const category = { ...this.categories[index] };
    if (payload.name !== undefined && payload.name !== null) {
      category.name = payload.name.trim();
    }
    if (payload.description !== undefined && payload.description !== null) {
      category.description = payload.description.trim();
    }

    this.categories[index] = category;
    return of({ ...category });
  }

  deleteCategory(categoryId: number): Observable<void> {
    const index = this.categories.findIndex((c) => c.categoryId === categoryId);
    if (index === -1) {
      return throwError(() => new CategoryNotFoundError());
    }

    // Simulate check for associated products (random for demo)
    const hasProducts = Math.random() > 0.7; // 30% chance of having products
    if (hasProducts) {
      return throwError(() => new CategoryHasProductsError());
    }

    this.categories = this.categories.filter((c) => c.categoryId !== categoryId);
    return of(undefined);
  }

  categoryHasProducts(categoryId: number): Observable<boolean> {
    const category = this.categories.find((c) => c.categoryId === categoryId);
    if (!category) {
      return throwError(() => new CategoryNotFoundError());
    }

    // Simulate check for associated products (random for demo)
    return of(Math.random() > 0.7); // 30% chance of having products
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { CategoryRepository } from '@domain/repositories/category.repository';
import { Category, UpdateCategoryPayload } from '@domain/models/category.model';
import { CategoryValidationError } from '@domain/models/category-errors';

@Injectable({
  providedIn: 'root',
})
export class UpdateCategoryUseCase {
  private readonly categoryRepository = inject(CategoryRepository);

  execute(categoryId: number, payload: UpdateCategoryPayload): Observable<Category> {
    const normalizedPayload: UpdateCategoryPayload = {
      ...payload,
      name: payload.name !== undefined ? payload.name?.trim() : undefined,
      description: payload.description !== undefined ? payload.description?.trim() : undefined,
    };

    try {
      this.validate(normalizedPayload);
    } catch (error) {
      return throwError(() => error);
    }

    return this.categoryRepository.updateCategory(categoryId, normalizedPayload);
  }

  private validate(payload: UpdateCategoryPayload): void {
    if (payload.name !== undefined) {
      if (!payload.name || payload.name === '') {
        throw new CategoryValidationError(
          { field: 'name' },
          'Category name cannot be empty.'
        );
      }

      if (payload.name.length > 100) {
        throw new CategoryValidationError(
          { field: 'name' },
          'Category name cannot exceed 100 characters.'
        );
      }
    }

    if (payload.description && payload.description.length > 500) {
      throw new CategoryValidationError(
        { field: 'description' },
        'Description cannot exceed 500 characters.'
      );
    }
  }
}

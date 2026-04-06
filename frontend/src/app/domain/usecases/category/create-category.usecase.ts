import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { CategoryRepository } from '@domain/repositories/category.repository';
import { Category, CreateCategoryPayload } from '@domain/models/category.model';
import { CategoryValidationError } from '@domain/models/category-errors';

@Injectable({
  providedIn: 'root',
})
export class CreateCategoryUseCase {
  private readonly categoryRepository = inject(CategoryRepository);

  execute(payload: CreateCategoryPayload): Observable<Category> {
    const normalizedPayload: CreateCategoryPayload = {
      name: payload.name?.trim() ?? '',
      description: payload.description?.trim() ?? '',
    };

    try {
      this.validate(normalizedPayload);
    } catch (error) {
      return throwError(() => error);
    }

    return this.categoryRepository.createCategory(normalizedPayload);
  }

  private validate(payload: CreateCategoryPayload): void {
    if (!payload.name) {
      throw new CategoryValidationError({ field: 'name' }, 'Category name is required.');
    }

    if (payload.name.length > 100) {
      throw new CategoryValidationError(
        { field: 'name' },
        'Category name cannot exceed 100 characters.'
      );
    }

    if (payload.description && payload.description.length > 500) {
      throw new CategoryValidationError(
        { field: 'description' },
        'Description cannot exceed 500 characters.'
      );
    }
  }
}

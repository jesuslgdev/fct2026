import { Injectable, inject } from '@angular/core';
import { CategoryRepository } from '@domain/repositories/category.repository';
import { Category, UpdateCategoryPayload } from '@domain/models/category.model';
import { CategoryNotFoundError, CategoryAlreadyExistsError, CategoryValidationError, CategoryApiError } from '@domain/models/category-errors';

@Injectable({
  providedIn: 'root',
})
export class UpdateCategoryUseCase {
  private readonly categoryRepository = inject(CategoryRepository);

  async execute(categoryId: number, payload: UpdateCategoryPayload): Promise<Category> {
    if (categoryId <= 0) {
      throw new CategoryNotFoundError('Invalid category ID.');
    }

    if (payload.name !== undefined && payload.name !== null) {
      if (!this.isValidCategoryName(payload.name)) {
        throw new CategoryValidationError(`Invalid category name: "${payload.name}". Must be 1-100 characters.`);
      }
    }

    if (payload.description !== undefined && payload.description !== null) {
      if (!this.isValidCategoryDescription(payload.description)) {
        throw new CategoryValidationError('Description too long (max 500 characters).');
      }
    }

    if (payload.name === null && payload.description === null) {
      throw new CategoryValidationError('At least one field must be provided for update.');
    }

    try {
      return await this.categoryRepository.updateCategory(
        categoryId,
        payload.name?.trim() || null,
        payload.description || null
      );
    } catch (error) {
      if (error instanceof CategoryNotFoundError || error instanceof CategoryAlreadyExistsError) {
        throw error;
      }
      throw new CategoryApiError('Failed to update category.');
    }
  }

  private isValidCategoryName(name: string): boolean {
    return Boolean(name && name.trim().length > 0 && name.trim().length <= 100);
  }

  private isValidCategoryDescription(description: string): boolean {
    return description.length <= 500;
  }
}

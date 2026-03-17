import { Injectable, inject } from '@angular/core';
import { CategoryRepository } from '@domain/repositories/category.repository';
import { Category, CreateCategoryPayload } from '@domain/models/category.model';
import { CategoryAlreadyExistsError, CategoryValidationError } from '@domain/models/category-errors';

@Injectable({
  providedIn: 'root',
})
export class CreateCategoryUseCase {
  private readonly categoryRepository = inject(CategoryRepository);

  async execute(payload: CreateCategoryPayload): Promise<Category> {
    if (!this.isValidCategoryName(payload.name)) {
      throw new CategoryValidationError(`Invalid category name: "${payload.name}". Must be 1-100 characters.`);
    }

    if (!this.isValidCategoryDescription(payload.description)) {
      throw new CategoryValidationError('Description too long (max 500 characters).');
    }

    try {
      return await this.categoryRepository.createCategory(payload.name.trim(), payload.description);
    } catch (error) {
      if (error instanceof CategoryAlreadyExistsError) {
        throw error;
      }
      throw new CategoryAlreadyExistsError(`Category with name "${payload.name}" already exists.`);
    }
  }

  private isValidCategoryName(name: string): boolean {
    return Boolean(name && name.trim().length > 0 && name.trim().length <= 100);
  }

  private isValidCategoryDescription(description: string): boolean {
    return description.length <= 500;
  }
}

import { Injectable, inject } from '@angular/core';
import { CategoryRepository } from '@domain/repositories/category.repository';
import { Category } from '@domain/models/category.model';
import { CategoryNotFoundError, CategoryApiError } from '@domain/models/category-errors';

@Injectable({
  providedIn: 'root',
})
export class GetCategoryByIdUseCase {
  private readonly categoryRepository = inject(CategoryRepository);

  async execute(categoryId: number): Promise<Category> {
    if (categoryId <= 0) {
      throw new CategoryNotFoundError('Invalid category ID.');
    }

    try {
      return await this.categoryRepository.getCategoryById(categoryId);
    } catch (error) {
      if (error instanceof CategoryNotFoundError) {
        throw error;
      }
      throw new CategoryApiError('Failed to fetch category.');
    }
  }
}

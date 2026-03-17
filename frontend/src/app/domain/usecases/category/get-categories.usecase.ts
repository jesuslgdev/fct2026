import { Injectable, inject } from '@angular/core';
import { CategoryRepository } from '@domain/repositories/category.repository';
import { CategoryListResult } from '@domain/models/category.model';
import { CategoryApiError } from '@domain/models/category-errors';

@Injectable({
  providedIn: 'root',
})
export class GetCategoriesUseCase {
  private readonly categoryRepository = inject(CategoryRepository);

  async execute(): Promise<CategoryListResult> {
    try {
      return await this.categoryRepository.getCategories();
    } catch {
      throw new CategoryApiError('Failed to fetch categories.');
    }
  }
}

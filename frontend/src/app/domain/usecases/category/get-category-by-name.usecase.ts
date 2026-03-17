import { Injectable, inject } from '@angular/core';
import { CategoryRepository } from '@domain/repositories/category.repository';
import { Category } from '@domain/models/category.model';
import { CategoryApiError } from '@domain/models/category-errors';

@Injectable({
  providedIn: 'root',
})
export class GetCategoryByNameUseCase {
  private readonly categoryRepository = inject(CategoryRepository);

  async execute(name: string): Promise<Category | null> {
    if (!name || name.trim().length === 0) {
      return null;
    }

    try {
      return await this.categoryRepository.getCategoryByName(name.trim());
    } catch {
      throw new CategoryApiError('Failed to fetch category by name.');
    }
  }
}

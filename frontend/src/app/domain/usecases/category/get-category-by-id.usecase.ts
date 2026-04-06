import { Injectable, inject } from '@angular/core';
import { CategoryRepository } from '@domain/repositories/category.repository';
import { Category } from '@domain/models/category.model';
import { CategoryNotFoundError } from '@domain/models/category-errors';

@Injectable({
  providedIn: 'root',
})
export class GetCategoryByIdUseCase {
  private readonly categoryRepository = inject(CategoryRepository);

  async execute(categoryId: number): Promise<Category> {
    const category = await this.categoryRepository.getCategoryById(categoryId);
    if (!category) {
      throw new CategoryNotFoundError();
    }
    return category;
  }
}

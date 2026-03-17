import { Injectable, inject } from '@angular/core';
import { CategoryRepository } from '@domain/repositories/category.repository';
import { CategoryNotFoundError, CategoryHasProductsError, CategoryApiError } from '@domain/models/category-errors';

@Injectable({
  providedIn: 'root',
})
export class DeleteCategoryUseCase {
  private readonly categoryRepository = inject(CategoryRepository);

  async execute(categoryId: number): Promise<void> {
    if (categoryId <= 0) {
      throw new CategoryNotFoundError('Invalid category ID.');
    }

    try {
      const hasProducts = await this.categoryRepository.categoryHasProducts(categoryId);
      if (hasProducts) {
        throw new CategoryHasProductsError('Cannot delete category with associated products.');
      }

      await this.categoryRepository.deleteCategory(categoryId);
    } catch (error) {
      if (error instanceof CategoryNotFoundError || error instanceof CategoryHasProductsError) {
        throw error;
      }
      throw new CategoryApiError('Failed to delete category.');
    }
  }
}

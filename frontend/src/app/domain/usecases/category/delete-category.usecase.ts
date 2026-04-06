import { Injectable, inject } from '@angular/core';
import { CategoryRepository } from '@domain/repositories/category.repository';
import { CategoryHasProductsError } from '@domain/models/category-errors';

@Injectable({
  providedIn: 'root',
})
export class DeleteCategoryUseCase {
  private readonly categoryRepository = inject(CategoryRepository);

  async execute(categoryId: number): Promise<void> {
    const hasProducts = await this.categoryRepository.categoryHasProducts(categoryId);
    if (hasProducts) {
      throw new CategoryHasProductsError();
    }
    return this.categoryRepository.deleteCategory(categoryId);
  }
}

import { Injectable, inject } from '@angular/core';
import { CategoryRepository } from '@domain/repositories/category.repository';

@Injectable({
  providedIn: 'root',
})
export class DeleteCategoryUseCase {
  private readonly categoryRepository = inject(CategoryRepository);

  execute(categoryId: number): Promise<void> {
    return this.categoryRepository.deleteCategory(categoryId);
  }
}

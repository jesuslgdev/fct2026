import { Injectable, inject } from '@angular/core';
import { CategoryRepository } from '@domain/repositories/category.repository';
import { Category, UpdateCategoryPayload } from '@domain/models/category.model';

@Injectable({
  providedIn: 'root',
})
export class UpdateCategoryUseCase {
  private readonly categoryRepository = inject(CategoryRepository);

  execute(categoryId: number, payload: UpdateCategoryPayload): Promise<Category> {
    return this.categoryRepository.updateCategory(categoryId, payload);
  }
}

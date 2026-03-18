import { Injectable, inject } from '@angular/core';
import { CategoryRepository } from '@domain/repositories/category.repository';
import { Category } from '@domain/models/category.model';

@Injectable({
  providedIn: 'root',
})
export class GetCategoryByIdUseCase {
  private readonly categoryRepository = inject(CategoryRepository);

  execute(categoryId: number): Promise<Category> {
    return this.categoryRepository.getCategoryById(categoryId);
  }
}

import { Injectable, inject } from '@angular/core';
import { CategoryRepository } from '@domain/repositories/category.repository';
import { Category } from '@domain/models/category.model';

@Injectable({
  providedIn: 'root',
})
export class GetCategoryByNameUseCase {
  private readonly categoryRepository = inject(CategoryRepository);

  execute(name: string): Promise<Category | null> {
    if (!name || name.trim().length === 0) {
      return Promise.resolve(null);
    }

    return this.categoryRepository.getCategoryByName(name.trim());
  }
}

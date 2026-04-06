import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CategoryRepository } from '@domain/repositories/category.repository';
import { CategoryListResult } from '@domain/models/category.model';

@Injectable({
  providedIn: 'root',
})
export class GetCategoriesUseCase {
  private readonly categoryRepository = inject(CategoryRepository);

  execute(): Observable<CategoryListResult> {
    return this.categoryRepository.getCategories();
  }
}

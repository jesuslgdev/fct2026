import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CategoryRepository } from '@domain/repositories/category.repository';
import { Category } from '@domain/models/category.model';

@Injectable({
  providedIn: 'root',
})
export class GetCategoryByIdUseCase {
  private readonly categoryRepository = inject(CategoryRepository);

  execute(categoryId: number): Observable<Category> {
    return this.categoryRepository.getCategoryById(categoryId);
  }
}

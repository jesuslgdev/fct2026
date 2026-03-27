import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CategoryRepository } from '@domain/repositories/category.repository';

@Injectable({
  providedIn: 'root',
})
export class DeleteCategoryUseCase {
  private readonly categoryRepository = inject(CategoryRepository);

  execute(categoryId: number): Observable<void> {
    return this.categoryRepository.deleteCategory(categoryId);
  }
}

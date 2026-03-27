import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CategoryRepository } from '@domain/repositories/category.repository';
import { Category, CreateCategoryPayload } from '@domain/models/category.model';

@Injectable({
  providedIn: 'root',
})
export class CreateCategoryUseCase {
  private readonly categoryRepository = inject(CategoryRepository);

  execute(payload: CreateCategoryPayload): Observable<Category> {
    return this.categoryRepository.createCategory(payload);
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductCategoryRepository } from '@domain/repositories/product-category.repository';
import { ProductCategory } from '@domain/models/product.model';

@Injectable({ providedIn: 'root' })
export class GetProductCategoriesUseCase {
  private readonly productCategoryRepository = inject(ProductCategoryRepository);

  execute(): Observable<ProductCategory[]> {
    return this.productCategoryRepository.getCategories();
  }
}

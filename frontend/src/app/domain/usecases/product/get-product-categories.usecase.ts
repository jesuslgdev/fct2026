import { Injectable, inject } from '@angular/core';
import { ProductCategoryRepository } from '@domain/repositories/product-category.repository';
import { ProductCategory } from '@domain/models/product.model';

@Injectable({ providedIn: 'root' })
export class GetProductCategoriesUseCase {
  private readonly productCategoryRepository = inject(ProductCategoryRepository);

  execute(): Promise<ProductCategory[]> {
    return this.productCategoryRepository.getCategories();
  }
}

import { Injectable, inject } from '@angular/core';
import { ProductRepository } from '@domain/repositories/product.repository';
import { Product, ProductQueryParams, PagedResult } from '@domain/models/product.model';

@Injectable({ providedIn: 'root' })
export class GetProductsUseCase {
  private readonly productRepository = inject(ProductRepository);

  execute(params: ProductQueryParams): Promise<PagedResult<Product>> {
    return this.productRepository.getProducts(params);
  }
}

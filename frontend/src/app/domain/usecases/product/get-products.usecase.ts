import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductRepository } from '@domain/repositories/product.repository';
import { Product, ProductQueryParams, PagedResult } from '@domain/models/product.model';

@Injectable({ providedIn: 'root' })
export class GetProductsUseCase {
  private readonly productRepository = inject(ProductRepository);

  execute(params: ProductQueryParams): Observable<PagedResult<Product>> {
    return this.productRepository.getProducts(params);
  }
}

import { Injectable, inject } from '@angular/core';
import { ProductRepository } from '@domain/repositories/product.repository';
import { Product } from '@domain/models/product.model';

@Injectable({ providedIn: 'root' })
export class GetProductByIdUseCase {
  private readonly productRepository = inject(ProductRepository);

  execute(productId: number): Promise<Product> {
    return this.productRepository.getProductById(productId);
  }
}

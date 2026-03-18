import { Injectable, inject } from '@angular/core';
import { ProductRepository } from '@domain/repositories/product.repository';
import { Product, UpdateProductPayload } from '@domain/models/product.model';

@Injectable({ providedIn: 'root' })
export class UpdateProductUseCase {
  private readonly productRepository = inject(ProductRepository);

  execute(productId: number, payload: UpdateProductPayload): Promise<Product> {
    return this.productRepository.updateProduct(productId, payload);
  }
}

import { Injectable, inject } from '@angular/core';
import { ProductRepository } from '@domain/repositories/product.repository';
import { Product, CreateProductPayload } from '@domain/models/product.model';

@Injectable({ providedIn: 'root' })
export class CreateProductUseCase {
  private readonly productRepository = inject(ProductRepository);

  execute(payload: CreateProductPayload): Promise<Product> {
    return this.productRepository.createProduct(payload);
  }
}

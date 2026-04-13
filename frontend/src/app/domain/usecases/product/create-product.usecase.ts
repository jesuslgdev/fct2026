import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductRepository } from '@domain/repositories/product.repository';
import { Product, CreateProductPayload } from '@domain/models/product.model';

@Injectable({ providedIn: 'root' })
export class CreateProductUseCase {
  private readonly productRepository = inject(ProductRepository);

  execute(payload: CreateProductPayload): Observable<Product> {
    return this.productRepository.createProduct(payload);
  }
}

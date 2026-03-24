import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductRepository } from '@domain/repositories/product.repository';
import { Product } from '@domain/models/product.model';

@Injectable({ providedIn: 'root' })
export class GetProductByIdUseCase {
  private readonly productRepository = inject(ProductRepository);

  execute(productId: number): Observable<Product> {
    return this.productRepository.getProductById(productId);
  }
}

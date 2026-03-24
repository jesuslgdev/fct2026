import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductRepository } from '@domain/repositories/product.repository';
import { Product } from '@domain/models/product.model';

@Injectable({ providedIn: 'root' })
export class GetLowStockProductsUseCase {
  private readonly productRepository = inject(ProductRepository);

  execute(): Observable<Product[]> {
    return this.productRepository.getLowStockProducts();
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductRepository } from '@domain/repositories/product.repository';

@Injectable({ providedIn: 'root' })
export class ToggleProductStatusUseCase {
  private readonly productRepository = inject(ProductRepository);

  execute(productId: number, isActive: boolean): Observable<void> {
    return this.productRepository.toggleProductStatus(productId, isActive);
  }
}

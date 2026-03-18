import { Injectable, inject } from '@angular/core';
import { ProductRepository } from '@domain/repositories/product.repository';

@Injectable({ providedIn: 'root' })
export class ToggleProductStatusUseCase {
  private readonly productRepository = inject(ProductRepository);

  execute(productId: number, isActive: boolean): Promise<void> {
    return this.productRepository.toggleProductStatus(productId, isActive);
  }
}

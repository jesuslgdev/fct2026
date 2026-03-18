import { Injectable, inject } from '@angular/core';
import { ProductRepository } from '@domain/repositories/product.repository';

@Injectable({ providedIn: 'root' })
export class CheckProductCodeUseCase {
  private readonly productRepository = inject(ProductRepository);

  execute(code: string): Promise<boolean> {
    return this.productRepository.checkCodeExists(code);
  }
}

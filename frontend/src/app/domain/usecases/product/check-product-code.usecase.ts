import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductRepository } from '@domain/repositories/product.repository';

@Injectable({ providedIn: 'root' })
export class CheckProductCodeUseCase {
  private readonly productRepository = inject(ProductRepository);

  execute(code: string): Observable<boolean> {
    return this.productRepository.checkCodeExists(code);
  }
}

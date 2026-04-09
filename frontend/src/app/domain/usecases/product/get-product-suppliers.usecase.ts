import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductRepository } from '@domain/repositories/product.repository';
import { ProductSupplier } from '@domain/models/product.model';

@Injectable({ providedIn: 'root' })
export class GetProductSuppliersUseCase {
  private readonly productRepository = inject(ProductRepository);

  execute(productId: number): Observable<ProductSupplier[]> {
    return this.productRepository.getProductSuppliers(productId);
  }
}

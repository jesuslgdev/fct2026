import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductRepository } from '@domain/repositories/product.repository';
import { ProductStockByWarehouse } from '@domain/models/product.model';

@Injectable({ providedIn: 'root' })
export class GetProductStockByWarehousesUseCase {
  private readonly productRepository = inject(ProductRepository);

  execute(productId: number): Observable<ProductStockByWarehouse[]> {
    return this.productRepository.getProductStockByWarehouses(productId);
  }
}

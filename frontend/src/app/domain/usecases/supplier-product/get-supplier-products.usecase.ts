import { Injectable, inject } from '@angular/core';
import { SupplierProductRepository } from '@domain/repositories/supplier-product.repository';
import { SupplierProduct } from '@domain/models/supplier-product.model';

@Injectable({ providedIn: 'root' })
export class GetSupplierProductsUseCase {
  private readonly supplierProductRepository = inject(SupplierProductRepository);

  execute(supplierId: string): Promise<SupplierProduct[]> {
    return this.supplierProductRepository.getSupplierProducts(supplierId);
  }
}

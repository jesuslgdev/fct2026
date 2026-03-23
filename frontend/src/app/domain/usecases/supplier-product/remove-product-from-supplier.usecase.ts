import { Injectable, inject } from '@angular/core';
import { SupplierProductRepository } from '@domain/repositories/supplier-product.repository';

@Injectable({ providedIn: 'root' })
export class RemoveProductFromSupplierUseCase {
  private readonly supplierProductRepository = inject(SupplierProductRepository);

  execute(supplierId: number, productId: number): Promise<void> {
    return this.supplierProductRepository.removeProductFromSupplier(supplierId, productId);
  }
}

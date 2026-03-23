import { Injectable, inject } from '@angular/core';
import { SupplierProductRepository } from '@domain/repositories/supplier-product.repository';
import { UpdateSupplierProductPriceRequest, SupplierProduct } from '@domain/models/supplier-product.model';

@Injectable({ providedIn: 'root' })
export class UpdateSupplierProductPriceUseCase {
  private readonly supplierProductRepository = inject(SupplierProductRepository);

  execute(supplierId: number, productId: number, request: UpdateSupplierProductPriceRequest): Promise<SupplierProduct> {
    return this.supplierProductRepository.updateSupplierProductPrice(supplierId, productId, request);
  }
}

import { Injectable, inject } from '@angular/core';
import { SupplierRepository } from '../../repositories/supplier.repository';
import { SupplierProduct } from '../../models/supplier-product.model';

@Injectable({ providedIn: 'root' })
export class GetSupplierProductsUseCase {
  private supplierRepository = inject(SupplierRepository);

  execute(supplierId: string): Promise<SupplierProduct[]> {
    return this.supplierRepository.getSupplierProducts(supplierId);
  }
}


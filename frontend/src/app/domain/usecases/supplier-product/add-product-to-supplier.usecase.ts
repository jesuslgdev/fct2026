import { Injectable, inject } from '@angular/core';
import { SupplierProductRepository } from '@domain/repositories/supplier-product.repository';
import { AddSupplierProductRequest, SupplierProduct } from '@domain/models/supplier-product.model';

@Injectable({ providedIn: 'root' })
export class AddProductToSupplierUseCase {
  private readonly supplierProductRepository = inject(SupplierProductRepository);

  execute(supplierId: string, request: AddSupplierProductRequest): Promise<SupplierProduct> {
    return this.supplierProductRepository.addProductToSupplier(supplierId, request);
  }
}

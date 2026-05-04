import { Injectable, inject } from '@angular/core';
import { SupplierRepository } from '../../repositories/supplier.repository';
import { Supplier, CreateSupplierRequest } from '../../models/supplier.model';

@Injectable({ providedIn: 'root' })
export class CreateSupplierUseCase {
  private supplierRepository = inject(SupplierRepository);

  execute(supplier: CreateSupplierRequest): Promise<Supplier> {
    return this.supplierRepository.createSupplier(supplier);
  }
}


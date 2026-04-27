import { Injectable, inject } from '@angular/core';
import { SupplierRepository } from '../../repositories/supplier.repository';
import { Supplier, UpdateSupplierRequest } from '../../models/supplier.model';

@Injectable({ providedIn: 'root' })
export class UpdateSupplierUseCase {
  private supplierRepository = inject(SupplierRepository);

  execute(id: string, supplier: UpdateSupplierRequest): Promise<Supplier> {
    return this.supplierRepository.updateSupplier(id, supplier);
  }
}


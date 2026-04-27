import { Injectable, inject } from '@angular/core';
import { SupplierRepository } from '../../repositories/supplier.repository';
import { Supplier } from '../../models/supplier.model';

@Injectable({ providedIn: 'root' })
export class ActivateSupplierUseCase {
  private supplierRepository = inject(SupplierRepository);

  execute(id: string): Promise<Supplier> {
    return this.supplierRepository.activateSupplier(id);
  }
}


import { Injectable, inject } from '@angular/core';
import { SupplierRepository } from '../../repositories/supplier.repository';
import { PageEvent } from '../../models/page-event.model';
import { Supplier } from '../../models/supplier.model';

@Injectable({ providedIn: 'root' })
export class GetSuppliersUseCase {
  private supplierRepository = inject(SupplierRepository);

  execute(pageEvent?: PageEvent): Promise<{
    data: Supplier[];
    total: number;
  }> {
    return this.supplierRepository.getSuppliers(pageEvent);
  }
}


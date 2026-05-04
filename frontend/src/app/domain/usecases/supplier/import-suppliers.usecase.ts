import { Injectable, inject } from '@angular/core';
import { SupplierRepository } from '../../repositories/supplier.repository';
import { SupplierImportExecutionResult } from '../../models/supplier.model';

@Injectable({ providedIn: 'root' })
export class ImportSuppliersUseCase {
  private supplierRepository = inject(SupplierRepository);

  execute(file: File): Promise<SupplierImportExecutionResult> {
    return this.supplierRepository.importSuppliers(file);
  }
}


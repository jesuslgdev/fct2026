import { Injectable, inject } from '@angular/core';
import { SupplierRepository } from '../../repositories/supplier.repository';
import { SupplierImportTemplate } from '../../models/supplier.model';

@Injectable({ providedIn: 'root' })
export class DownloadSupplierTemplateUseCase {
  private supplierRepository = inject(SupplierRepository);

  execute(): Promise<SupplierImportTemplate> {
    return this.supplierRepository.downloadImportTemplate();
  }
}


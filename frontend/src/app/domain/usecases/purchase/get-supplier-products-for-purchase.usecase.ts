import { Injectable, inject } from '@angular/core';
import {
  PurchaseSupplierProductOption,
} from '@domain/models/purchase.model';
import { PurchaseValidationError } from '@domain/models/purchase-errors';
import { PurchaseRepository } from '@domain/repositories/purchase.repository';
import { defer, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GetSupplierProductsForPurchaseUseCase {
  private readonly purchaseRepository = inject(PurchaseRepository);

  execute(supplierId: number): Observable<PurchaseSupplierProductOption[]> {
    return defer(() => {
      if (!Number.isInteger(supplierId) || supplierId <= 0) {
        throw new PurchaseValidationError(
          { field: 'supplierId', value: supplierId },
          'supplierId must be a positive integer.',
        );
      }

      return this.purchaseRepository.getSupplierProducts(supplierId);
    });
  }
}

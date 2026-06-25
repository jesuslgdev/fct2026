import { Injectable, inject } from '@angular/core';
import {
  PurchasePermissionContext,
  PurchaseSupplierProductOption,
} from '@domain/models/purchase.model';
import {
  assertCanManagePurchases,
  assertPositiveSupplierId,
} from '@domain/models/purchase-rules';
import { PurchaseRepository } from '@domain/repositories/purchase.repository';
import { defer, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GetSupplierProductsForPurchaseUseCase {
  private readonly purchaseRepository = inject(PurchaseRepository);

  execute(
    supplierId: number,
    permissionContext: PurchasePermissionContext,
  ): Observable<PurchaseSupplierProductOption[]> {
    return defer(() => {
      assertCanManagePurchases(permissionContext);
      assertPositiveSupplierId(supplierId);
      return this.purchaseRepository.getSupplierProducts(supplierId);
    });
  }
}
